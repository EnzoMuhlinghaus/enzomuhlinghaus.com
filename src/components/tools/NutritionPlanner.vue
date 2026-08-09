<script setup lang="ts">
// Fuel Planner — the workbench's fourth tool card.
//
// Renders the form, runs the pure rules engine (src/lib/nutrition.ts) on
// submit, and shows the plan: hero price, what to buy, intake schedule,
// assumptions and notes. Five UI states per the design (nutrition-planner
// handoff §1): idle (empty box), loading (dots, kept for the optional server
// route / slow devices), success (results, incl. the no-fuel $0.00 variant),
// and error (banner + CHECK THESE recap while the live form keeps the
// offending fields highlighted). State regions use v-if, NOT v-show — a
// display:grid/flex class on the same element would override the UA's
// [hidden] and leak the region (design handoff §11).
//
// The component is deliberately dumb: it renders `Plan`, it never re-derives
// carb math. Brand is the registry default (Maurten) for v1 — there is no
// brand picker in the design; adding one later is a UI-only change.
import { computed, onBeforeUnmount, ref, useId } from 'vue';
import { useMessages } from '../../i18n';
import {
  BRANDS,
  DEFAULT_BRAND_ID,
  getProducts,
  type FormatPreference,
  type Intensity,
} from '../../data/nutrition';
import {
  calculatePlan,
  normalizeInput,
  type Plan,
  type ScheduleEntry,
} from '../../lib/nutrition';
import ToolCard from './ToolCard.vue';

const m = useMessages();
const uid = useId();

const BRAND = BRANDS[DEFAULT_BRAND_ID]!;
const PRODUCTS = getProducts(DEFAULT_BRAND_ID);

type UiState = 'idle' | 'loading' | 'success' | 'error';
const state = ref<UiState>('idle');

/** Field error in the API contract's shape (spec §5.4 codes). */
interface FieldError {
  field: string;
  code: string;
}

const DURATION_CHIPS = [30, 45, 60, 90, 120, 150, 180];
const INTENSITIES: Intensity[] = ['easy', 'moderate', 'hard', 'race'];
const FORMATS: FormatPreference[] = ['auto', 'gels', 'drink', 'mixed'];

// Form state (spec §2 defaults: weight 70 via blank, temp blank = unknown,
// caffeine off, format auto, preload on when eligible).
const durationValue = ref('180');
const intensity = ref<Intensity>('race');
const weightValue = ref('');
const tempValue = ref('');
const caffeine = ref(false);
const formatPreference = ref<FormatPreference>('auto');
const preload = ref(true);

const plan = ref<Plan | null>(null);
const errors = ref<FieldError[]>([]);

const durationNum = computed(() => {
  const n = Number(durationValue.value);
  return Number.isFinite(n) ? n : null;
});

/** Preload row appears only for race intensity on sessions ≥ 150 min (spec §3.4). */
const showPreload = computed(
  () => intensity.value === 'race' && (durationNum.value ?? 0) >= 150,
);

const rateFor = (i: Intensity) => BRAND.rules.carbPerHourByIntensity[i];

// --- display helpers -------------------------------------------------------

const money = (n: number) => `$${n.toFixed(2)}`;
const hmm = (minutes: number) =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

/** "3:10 RACE" — the context line under the hero price. */
const priceCtx = computed(() =>
  plan.value
    ? `${hmm(plan.value.inputs.durationMinutes)} ${m.value.nutrition.intensities[plan.value.inputs.intensity]}`
    : '',
);

/** catalogVersion "2026-08" → "Aug 2026" (design's price-sub line). */
const catalogLabel = (v: string) => {
  const [y, mo] = v.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return mo && names[Number(mo) - 1] ? `${names[Number(mo) - 1]} ${y}` : v;
};

const isCaffeineEntry = (e: ScheduleEntry) =>
  (plan.value?.items.find((it) => it.productId === e.productId)?.caffeineMg ?? null) !== null;

const preloadProduct = computed(() => {
  const p = plan.value?.preRacePreload;
  return p ? PRODUCTS.find((pr) => pr.id === p.productId) ?? null : null;
});

const isMedNote = (n: string) => n.toLowerCase().includes('not medical advice');

// --- validation (client-side; ranges from spec §2, codes from §5.4) --------

function validate(): FieldError[] {
  const out: FieldError[] = [];
  const d = durationValue.value.trim();
  if (d === '') {
    out.push({ field: 'durationMinutes', code: 'REQUIRED' });
  } else {
    const n = Number(d);
    if (!Number.isInteger(n) || n < 5 || n > 720) {
      out.push({ field: 'durationMinutes', code: 'OUT_OF_RANGE' });
    }
  }
  const w = weightValue.value.trim();
  if (w !== '') {
    const n = Number(w);
    if (!Number.isFinite(n) || n < 30 || n > 200) {
      out.push({ field: 'bodyWeightKg', code: 'OUT_OF_RANGE' });
    }
  }
  const t = tempValue.value.trim();
  if (t !== '') {
    const n = Number(t);
    if (!Number.isFinite(n) || n < -20 || n > 50) {
      out.push({ field: 'temperatureC', code: 'OUT_OF_RANGE' });
    }
  }
  return out;
}

const hasError = (field: string) => errors.value.some((e) => e.field === field);

const fieldLabel = (field: string) => {
  switch (field) {
    case 'durationMinutes':
      return m.value.nutrition.durationLabel;
    case 'bodyWeightKg':
      return m.value.nutrition.weightLabel;
    case 'temperatureC':
      return m.value.nutrition.tempLabel;
    case 'intensity':
      return m.value.nutrition.intensityLabel;
    default:
      return field;
  }
};

const errorMessage = (e: FieldError) => {
  switch (e.field) {
    case 'durationMinutes':
      return e.code === 'REQUIRED'
        ? m.value.nutrition.errDurationRequired
        : m.value.nutrition.errDurationRange(durationValue.value.trim());
    case 'bodyWeightKg':
      return m.value.nutrition.errWeightRange;
    case 'temperatureC':
      return m.value.nutrition.errTempRange;
    case 'intensity':
      return m.value.nutrition.errIntensity;
    default:
      return e.code;
  }
};

// --- submit / state transitions --------------------------------------------

let loadingTimer: ReturnType<typeof setTimeout> | null = null;

function submit() {
  if (state.value === 'loading') return;
  const fieldErrors = validate();
  if (fieldErrors.length > 0) {
    errors.value = fieldErrors;
    state.value = 'error';
    return;
  }
  errors.value = [];
  state.value = 'loading';
  // v1 computes client-side with no network; keep the dots on screen ≥ 250 ms
  // so the state is visible rather than a flicker (design handoff §7).
  loadingTimer = setTimeout(() => {
    try {
      plan.value = calculatePlan(
        normalizeInput({
          brand: DEFAULT_BRAND_ID,
          durationMinutes: Number(durationValue.value),
          intensity: intensity.value,
          bodyWeightKg:
            weightValue.value.trim() === '' ? undefined : Number(weightValue.value),
          temperatureC: tempValue.value.trim() === '' ? null : Number(tempValue.value),
          caffeine: caffeine.value,
          formatPreference: formatPreference.value,
          preRacePreload: preload.value,
        }),
        BRAND,
        PRODUCTS,
      );
      state.value = 'success';
    } catch {
      errors.value = [{ field: 'body', code: 'INTERNAL' }];
      state.value = 'error';
    }
  }, 300);
}

/** "adjust my inputs" / early return — back to the form, values preserved. */
function adjust() {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  errors.value = [];
  state.value = 'idle';
}

onBeforeUnmount(() => {
  if (loadingTimer) clearTimeout(loadingTimer);
});
</script>

<template>
  <ToolCard
    no="04"
    tone="l"
    anchor="nutrition-planner"
    :title="m.nutrition.title"
    :subtitle="m.nutrition.blurb"
    :help="m.nutrition.help"
  >
    <!-- ---------------- FORM (stays live in idle / loading / error) ------- -->
    <form v-if="state !== 'success'" class="fp-form" @submit.prevent="submit">
      <!-- session length -->
      <div class="fp-field">
        <label class="field-label" :for="`${uid}-duration`">
          {{ m.nutrition.durationLabel }}
        </label>
        <div class="chip-row">
          <button
            v-for="c in DURATION_CHIPS"
            :key="c"
            type="button"
            class="chip"
            :class="{ active: durationValue === String(c) }"
            @click="durationValue = String(c)"
          >
            {{ c }}
          </button>
        </div>
        <div class="fp-input-row">
          <input
            :id="`${uid}-duration`"
            v-model="durationValue"
            type="text"
            inputmode="numeric"
            class="wf wf--sm"
            :class="{ 'has-error': hasError('durationMinutes') }"
            :aria-invalid="hasError('durationMinutes') || undefined"
            :aria-describedby="hasError('durationMinutes') ? `${uid}-duration-err` : undefined"
          />
          <span class="suffix">{{ m.nutrition.minSuffix }}</span>
        </div>
        <p
          v-if="hasError('durationMinutes')"
          :id="`${uid}-duration-err`"
          class="field-error"
        >
          {{ m.nutrition.durationLabel }} — {{ errorMessage(errors.find((e) => e.field === 'durationMinutes')!) }}
        </p>
      </div>

      <!-- intensity -->
      <div class="fp-field fp-intensity-pills">
        <span class="field-label">{{ m.nutrition.intensityLabel }}</span>
        <div class="pill-row">
          <button
            v-for="i in INTENSITIES"
            :key="i"
            type="button"
            class="pill"
            :class="{ active: intensity === i }"
            :aria-pressed="intensity === i"
            @click="intensity = i"
          >
            {{ m.nutrition.intensities[i] }}
          </button>
        </div>
        <p class="field-hint" aria-live="polite">
          {{ m.nutrition.intensities[intensity] }} — {{ m.nutrition.intensityHints[intensity] }} ·
          {{ m.nutrition.carbsRate(rateFor(intensity)) }}
        </p>
      </div>

      <!-- body weight -->
      <div class="fp-field">
        <label class="field-label" :for="`${uid}-weight`">
          {{ m.nutrition.weightLabel }}
        </label>
        <div class="fp-input-row">
          <input
            :id="`${uid}-weight`"
            v-model="weightValue"
            type="text"
            inputmode="decimal"
            class="wf wf--sm"
            placeholder="70"
            :class="{ 'has-error': hasError('bodyWeightKg') }"
            :aria-invalid="hasError('bodyWeightKg') || undefined"
            :aria-describedby="hasError('bodyWeightKg') ? `${uid}-weight-err` : undefined"
          />
          <span class="suffix">{{ m.nutrition.kgSuffix }}</span>
        </div>
        <p
          v-if="hasError('bodyWeightKg')"
          :id="`${uid}-weight-err`"
          class="field-error"
        >
          {{ m.nutrition.weightLabel }} — {{ errorMessage(errors.find((e) => e.field === 'bodyWeightKg')!) }}
        </p>
      </div>

      <!-- temperature -->
      <div class="fp-field">
        <label class="field-label" :for="`${uid}-temp`">
          {{ m.nutrition.tempLabel }}
        </label>
        <div class="fp-input-row">
          <input
            :id="`${uid}-temp`"
            v-model="tempValue"
            type="text"
            inputmode="decimal"
            class="wf wf--sm"
            placeholder="—"
            :class="{ 'has-error': hasError('temperatureC') }"
            :aria-invalid="hasError('temperatureC') || undefined"
            :aria-describedby="hasError('temperatureC') ? `${uid}-temp-err` : undefined"
          />
          <span class="suffix">{{ m.nutrition.cSuffix }}</span>
        </div>
        <p
          v-if="hasError('temperatureC')"
          :id="`${uid}-temp-err`"
          class="field-error"
        >
          {{ m.nutrition.tempLabel }} — {{ errorMessage(errors.find((e) => e.field === 'temperatureC')!) }}
        </p>
      </div>

      <!-- caffeine -->
      <div class="fp-field">
        <span class="field-label">{{ m.nutrition.caffeineLabel }}</span>
        <div class="fp-toggle-row">
          <button
            type="button"
            class="pill"
            :class="{ active: !caffeine }"
            :aria-pressed="!caffeine"
            @click="caffeine = false"
          >
            {{ m.nutrition.caffeine.no }}
          </button>
          <button
            type="button"
            class="pill"
            :class="{ active: caffeine }"
            :aria-pressed="caffeine"
            @click="caffeine = true"
          >
            {{ m.nutrition.caffeine.yes }}
          </button>
        </div>
      </div>

      <!-- format -->
      <div class="fp-field">
        <span class="field-label">{{ m.nutrition.formatLabel }}</span>
        <div class="fp-toggle-row">
          <button
            v-for="f in FORMATS"
            :key="f"
            type="button"
            class="pill"
            :class="{ active: formatPreference === f }"
            :aria-pressed="formatPreference === f"
            @click="formatPreference = f"
          >
            {{ m.nutrition.formats[f] }}
          </button>
        </div>
      </div>

      <!-- pre-race preload (race only, ≥ 150 min) -->
      <div v-if="showPreload" class="fp-field fp-full">
        <span class="field-label">{{ m.nutrition.preloadLabel }}</span>
        <div class="fp-toggle-row">
          <button
            type="button"
            class="pill"
            :class="{ active: !preload }"
            :aria-pressed="!preload"
            @click="preload = false"
          >
            {{ m.nutrition.preload.off }}
          </button>
          <button
            type="button"
            class="pill"
            :class="{ active: preload }"
            :aria-pressed="preload"
            @click="preload = true"
          >
            {{ m.nutrition.preload.on }}
          </button>
          <span class="field-hint fp-preload-hint">{{ m.nutrition.preloadHint }}</span>
        </div>
      </div>

      <!-- CTA -->
      <div class="fp-cta-row">
        <button class="hand-link" type="submit">
          {{ m.nutrition.cta }} <span class="arrow-ne">→</span>
        </button>
        <span class="fp-cta-note">{{ m.nutrition.ctaNote }}</span>
      </div>
    </form>

    <!-- ---------------- RESULT REGION (announced politely) ---------------- -->
    <div class="fp-region" aria-live="polite" :aria-busy="state === 'loading'">
      <!-- EMPTY — never submitted yet -->
      <div v-if="state === 'idle'" class="fp-statebox">
        <div class="box">
          <p class="b-title">{{ m.nutrition.emptyTitle }}</p>
          <p class="b-sub">{{ m.nutrition.emptySub }}</p>
          <p class="b-mono">{{ m.nutrition.emptyMono }}</p>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="state === 'loading'" class="fp-statebox fp-loading">
        <div class="box">
          <p class="b-title">
            {{ m.nutrition.loadingTitle }}<span class="dot">.</span><span class="dot">.</span
            ><span class="dot">.</span>
          </p>
          <p class="b-sub">{{ m.nutrition.loadingSub }}</p>
          <p class="b-mono">{{ m.nutrition.loadingMono }}</p>
        </div>
      </div>

      <!-- ERROR — banner + recap, while the live form keeps its red fields -->
      <div v-if="state === 'error'" class="fp-statebox">
        <div class="fp-errorbox">
          <p class="e-title">{{ m.nutrition.errorTitle }}</p>
          <p class="e-detail">{{ m.nutrition.errorDetail(errors.length) }}</p>
          <p class="e-detail e-retry">
            <button class="stamp-link" type="button" @click="submit">
              {{ m.nutrition.tryAgain }}
            </button>
          </p>
        </div>
        <div v-if="errors.length > 0" class="fp-recap">
          <div class="fp-col-title">{{ m.nutrition.checkThese }}</div>
          <p v-for="(e, i) in errors" :key="i" class="fp-recap-line">
            · {{ fieldLabel(e.field) }} — {{ errorMessage(e) }}
          </p>
        </div>
      </div>

      <!-- RESULTS -->
      <div v-if="state === 'success' && plan" class="fp-results">
        <div class="fp-result-banner result-rule">
          <div>
            <div class="fp-result-label">{{ m.nutrition.resultLabel }}</div>
            <div class="fp-price">{{ money(plan.totals.price) }}</div>
          </div>
          <div>
            <div class="fp-price-sub">
              {{ m.nutrition.priceSub(plan.totals.units, plan.totals.carbsDeliveredG, priceCtx) }}
            </div>
            <div class="fp-price-sub meta">
              {{ plan.meta.currency }} — {{ plan.meta.brand }}.com · {{ catalogLabel(plan.meta.catalogVersion) }}
            </div>
          </div>
        </div>

        <!-- no-fuel variant (S5: < 45 min → target 0) -->
        <div v-if="plan.items.length === 0" class="fp-no-fuel">
          <p class="b-title">{{ m.nutrition.noFuelTitle }}</p>
          <p class="b-sub">{{ m.nutrition.noFuelSub }}</p>
        </div>

        <div v-else class="fp-cols">
          <div>
            <div class="fp-col-title">{{ m.nutrition.whatToBuy }}</div>
            <div class="fp-items">
              <div
                v-for="it in plan.items"
                :key="it.productId"
                class="fp-item"
                :class="{ caf: it.caffeineMg !== null }"
              >
                <span class="qty">{{ it.quantity }}×</span>
                <span class="name">{{ it.name }}</span>
                <span class="sub">{{ it.carbsG }} g</span>
                <span class="fill"></span>
                <span class="price">{{ money(it.subtotal) }}</span>
              </div>
            </div>
            <p class="fp-carb-line">
              <strong>{{ plan.totals.carbsDeliveredG }} g</strong> {{ m.nutrition.carbsDelivered }}
              · {{ m.nutrition.carbsTarget }} <strong>{{ plan.totals.targetG }} g</strong>
              {{ m.nutrition.carbsNote }}
            </p>
          </div>

          <div>
            <div class="fp-col-title">{{ m.nutrition.scheduleTitle }}</div>
            <div class="fp-schedule">
              <div v-if="preloadProduct" class="fp-sched-row preload">
                <span class="t">−90′</span>
                <span>{{ m.nutrition.preloadShort }}</span>
                <span class="fill"></span>
                <span>
                  {{ preloadProduct.name }} — {{ m.nutrition.beforeStart }} ·
                  <strong>+{{ money(plan.preRacePreload!.price) }}</strong>
                </span>
              </div>
              <div
                v-for="e in plan.schedule"
                :key="`${e.offsetMin}-${e.label}`"
                class="fp-sched-row"
              >
                <span class="t">{{ e.offsetMin }}′</span>
                <span>{{ e.label }}</span>
                <span class="fill"></span>
                <span v-if="isCaffeineEntry(e)" class="tag">{{ m.nutrition.caffeineTag }}</span>
                <span>{{ e.action }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="fp-assumptions result-rule">
          <div class="fp-col-title">{{ m.nutrition.whyThisPlan }}</div>
          <p v-for="(a, i) in plan.assumptions" :key="i">· {{ a }}</p>
        </div>
        <div class="fp-notes">
          <p v-for="(n, i) in plan.notes" :key="i" :class="{ med: isMedNote(n) }">· {{ n }}</p>
        </div>

        <div class="fp-back">
          <button class="hand-link hand-link--back" type="button" @click="adjust">
            <span class="arrow-ne arrow-back">→</span> {{ m.nutrition.adjust }}
          </button>
        </div>
      </div>
    </div>
  </ToolCard>
</template>

<style scoped>
/* ---- shared control classes (handoff §5, values 1:1 from the design
   mockup) — the sibling tools define these in their own scoped styles and
   they are NOT in global.css, so without them the form renders unstyled. */
.wf {
  font-size: 20px;
  width: 100%;
}

.wf--sm {
  font-size: 22px;
  width: 150px;
}

.wf.has-error {
  border-color: var(--red);
  box-shadow: 0 0 0 2px rgba(193, 68, 46, 0.18);
}

.field-label {
  display: block;
  font-family: var(--font-label);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--gold);
  margin-bottom: 6px;
}

.field-hint {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 15px;
  color: var(--on-desk-3);
  margin: 6px 0 0;
  line-height: 1.2;
}

.field-error {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--red);
  margin: 5px 0 0;
}

/* ---- form layout (design mockup tokens, 1:1) ---- */
.fp-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 18px;
  margin-top: 4px;
}

.fp-field {
  min-width: 0;
}

.fp-full {
  grid-column: 1 / -1;
}

.fp-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fp-input-row .wf {
  flex: 1;
  min-width: 0;
}

.fp-input-row .wf--sm {
  flex: 0 0 150px;
}

.fp-input-row .suffix {
  font-family: var(--font-label);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--gold);
  white-space: nowrap;
}

.fp-toggle-row {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.fp-intensity-pills .pill {
  font-size: 9.5px;
  padding: 6px 11px;
}

.chip-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.fp-preload-hint {
  margin: 2px 0 0 10px;
}

.fp-cta-row {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.fp-cta-note {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 15px;
  color: var(--muted);
}

/* ---- results ---- */
.fp-result-banner {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 14px;
}

.fp-result-label {
  font-family: var(--font-label);
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--red);
  margin-bottom: 2px;
}

.fp-price {
  font-family: var(--font-mono);
  font-size: 34px;
  font-weight: 700;
  color: var(--red);
  line-height: 1;
}

.fp-price-sub {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  text-align: right;
  margin-top: 5px;
}

.fp-price-sub.meta {
  margin-top: 2px;
}

.fp-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 16px;
}

.fp-col-title {
  font-family: var(--font-label);
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--gold);
  margin-bottom: 8px;
}

.fp-items {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.fp-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 19px;
  color: var(--ink);
}

.fp-item .qty {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
  white-space: nowrap;
}

.fp-item .sub {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--faint);
  white-space: nowrap;
}

.fp-item .price {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
}

.fp-item.caf .name::after {
  content: ' ☕';
  font-size: 13px;
}

.fp-item .fill,
.fp-sched-row .fill {
  flex: 1;
  border-bottom: 2px dotted rgba(154, 130, 88, 0.5);
  transform: translateY(-5px);
}

.fp-carb-line {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  margin-top: 10px;
}

.fp-carb-line strong {
  color: var(--ink-2);
  font-weight: 700;
}

.fp-schedule {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.fp-sched-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 17px;
  color: var(--ink);
}

.fp-sched-row .t {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--gold);
  width: 34px;
  flex-shrink: 0;
}

.fp-sched-row .tag {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--red);
  border: 1px solid rgba(193, 68, 46, 0.45);
  border-radius: 999px;
  padding: 1px 7px;
  white-space: nowrap;
}

.fp-sched-row.preload .t {
  color: var(--rust);
}

.fp-assumptions {
  margin-top: 16px;
  padding-top: 12px;
}

.fp-assumptions p,
.fp-notes p {
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.6;
  color: var(--muted);
  margin: 0 0 3px;
}

.fp-notes {
  margin-top: 10px;
}

.fp-notes p {
  color: var(--ink-2);
}

.fp-notes p.med {
  color: var(--red);
}

.fp-back {
  margin-top: 14px;
}

.fp-back .hand-link--back {
  font-size: 20px;
  color: var(--muted);
}

.arrow-back {
  transform: rotate(135deg);
}

/* ---- no-fuel variant ---- */
.fp-no-fuel {
  border: 1.5px dashed rgba(154, 130, 88, 0.55);
  border-radius: 10px;
  padding: 18px 20px;
  text-align: center;
  margin-top: 16px;
  background: repeating-linear-gradient(
    45deg,
    rgba(246, 239, 221, 0.5) 0 14px,
    rgba(246, 239, 221, 0.9) 14px 28px
  );
}

/* ---- empty / loading / error ---- */
.fp-statebox {
  margin-top: 6px;
  border-top: 1.5px dashed rgba(154, 130, 88, 0.45);
  padding-top: 16px;
}

.fp-statebox .box {
  border: 1.5px dashed rgba(154, 130, 88, 0.55);
  border-radius: 10px;
  padding: 22px 20px;
  text-align: center;
  background: repeating-linear-gradient(
    45deg,
    rgba(246, 239, 221, 0.5) 0 14px,
    rgba(246, 239, 221, 0.9) 14px 28px
  );
}

.fp-statebox .box .b-title {
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 24px;
  color: var(--ink-2);
  margin: 0 0 4px;
}

.fp-statebox .box .b-sub {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 16px;
  color: var(--muted);
  margin: 0;
}

.fp-statebox .box .b-mono {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--faint);
  margin: 8px 0 0;
}

.fp-loading .dot {
  display: inline-block;
  animation: fpblink 1.2s infinite;
}

.fp-loading .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.fp-loading .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes fpblink {
  0%,
  60%,
  100% {
    opacity: 0.25;
  }
  30% {
    opacity: 1;
  }
}

.fp-errorbox {
  border: 1.5px solid var(--red);
  border-radius: 10px;
  padding: 16px 18px;
  background: rgba(193, 68, 46, 0.06);
}

.fp-errorbox .e-title {
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 22px;
  color: var(--red);
  margin: 0 0 4px;
}

.fp-errorbox .e-detail {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-2);
  line-height: 1.6;
  margin: 0;
}

.fp-errorbox .e-retry {
  margin-top: 8px;
}

/* `.stamp-link` is styled for <a> in global.css; as a <button> it needs the
   UA chrome (background/border/padding) reset, keeping the global look. */
button.stamp-link {
  background: none;
  border: 0;
  border-bottom: 2px solid rgba(154, 130, 88, 0.5);
  padding: 0;
  cursor: pointer;
}

.fp-recap {
  margin-top: 16px;
}

.fp-recap-line {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--red);
  line-height: 1.7;
  margin: 0;
}

@media (max-width: 620px) {
  .fp-form {
    grid-template-columns: 1fr;
  }

  .fp-cols {
    grid-template-columns: 1fr;
  }
}

/* Out-specifies the global coarse-pointer rule (`.fp-intensity-pills .pill`
   is more specific than the global `.pill`), so restate it here — same
   pattern as PaceCalculator (handoff §8: touch targets stay 44px). */
@media (pointer: coarse) {
  .fp-intensity-pills .pill {
    padding: 14px 16px;
  }
}
</style>
