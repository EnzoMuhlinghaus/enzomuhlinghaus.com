<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { KM_PER_MI, parseTime, formatTime } from '../../lib/time';
import { vo2Cost, vdotFromRace, timeMinFromVdot } from '../../lib/vdot';
import { useUnit } from '../../lib/units';
import { useMessages } from '../../i18n';
import ToolCard from './ToolCard.vue';
import HelpBubble from './HelpBubble.vue';

const m = useMessages();
const unit = useUnit();
/** Prefix for the label/input `for` pairs — unique per mounted card. */
const uid = useId();

const ORDER = ['5K', '10K', 'Half', 'Marathon'] as const;
type Dist = (typeof ORDER)[number];
const DIST_KM: Record<Dist, number> = { '5K': 5, '10K': 10, Half: 21.0975, Marathon: 42.195 };
const DEFAULTS: Record<Dist, string> = { '5K': '18:38', '10K': '38:50', Half: '1:27:42', Marathon: '3:42:05' };

const source = ref<'race' | 'mas'>('race');
const selected = ref<Dist>('10K');
const times = ref<Record<string, string>>({ ...DEFAULTS });
const masValue = ref('16.5');

const distLabel = (k: string) => (k === 'Half' ? m.value.common.half : k);

const rawTime = computed({
  get: () => times.value[selected.value] ?? '',
  set: (v: string) => {
    times.value = { ...times.value, [selected.value]: v };
  },
});

/** Both sources collapse to a single VDOT, which drives every predicted time. */
const vdot = computed<number | null>(() => {
  if (source.value === 'race') {
    const seconds = parseTime(rawTime.value);
    return seconds == null ? null : vdotFromRace(DIST_KM[selected.value] * 1000, seconds / 60);
  }
  const kmh = parseFloat(masValue.value);
  return Number.isFinite(kmh) && kmh > 0 ? vo2Cost((kmh * 1000) / 60) : null;
});

const methodTag = computed(() => {
  if (vdot.value == null) return '—';
  return source.value === 'mas' ? m.value.predictor.tagMasVdot : m.value.predictor.tagVdot;
});

const predictions = computed(() => {
  const distInUnit = (km: number) => (unit.value === 'km' ? km : km / KM_PER_MI);
  // With a race as the source, that distance is an input, not a prediction.
  const shown = ORDER.filter((k) => !(source.value === 'race' && k === selected.value));

  return shown.map((k) => {
    if (vdot.value == null) return { key: k, label: distLabel(k), time: '—', pace: '—' };
    const seconds = timeMinFromVdot(DIST_KM[k] * 1000, vdot.value) * 60;
    return {
      key: k,
      label: distLabel(k),
      time: formatTime(seconds),
      pace: `${formatTime(seconds / distInUnit(DIST_KM[k]))}/${unit.value}`,
    };
  });
});
</script>

<template>
  <ToolCard
    no="02"
    tone="r"
    anchor="race-predictor"
    :title="m.predictor.title"
    :subtitle="m.predictor.blurb"
    :help="m.predictor.help"
  >
    <div class="field-label">{{ m.predictor.predictFrom }}</div>
    <div class="pill-row">
      <button class="pill" :class="{ active: source === 'race' }" :aria-pressed="source === 'race'" @click="source = 'race'">
        {{ m.predictor.sourceRace }}
      </button>
      <button class="pill" :class="{ active: source === 'mas' }" :aria-pressed="source === 'mas'" @click="source = 'mas'">
        {{ m.predictor.sourceMas }}
      </button>
    </div>

    <template v-if="source === 'race'">
      <div class="pill-row">
        <button
          v-for="k in ORDER"
          :key="k"
          class="pill"
          :class="{ active: selected === k }"
          :aria-pressed="selected === k"
          @click="selected = k"
        >
          {{ distLabel(k) }}
        </button>
      </div>
      <div class="field">
        <label class="field-label" :for="`${uid}-time`">
          {{ m.predictor.yourTimeFor(distLabel(selected)) }}
        </label>
        <input
          :id="`${uid}-time`"
          v-model="rawTime"
          type="text"
          class="wf wf--sm"
          :placeholder="DEFAULTS[selected]"
        />
      </div>
    </template>

    <div v-else class="field">
      <label class="field-label" :for="`${uid}-mas`">{{ m.predictor.masFieldLabel }}</label>
      <input
        :id="`${uid}-mas`"
        v-model="masValue"
        type="text"
        inputmode="decimal"
        class="wf wf--sm"
        placeholder="16.5"
      />
    </div>

    <div class="result-head result-rule">
      <span class="result-label">{{ m.predictor.predicted }}</span>
      <span class="method">
        <span class="method-tag">{{ methodTag }}</span>
        <HelpBubble :text="m.predictor.vdotHint" size="sm" right />
      </span>
    </div>
    <div class="predictions">
      <div v-for="p in predictions" :key="p.key" class="leader">
        <span class="pred-label">{{ p.label }}</span>
        <span class="leader__fill" />
        <span class="pred-time">{{ p.time }}</span>
        <span class="pred-pace">{{ p.pace }}</span>
      </div>
    </div>
  </ToolCard>
</template>

<style scoped>
.field-label {
  display: block;
  font-family: var(--font-label);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--gold);
  margin-bottom: 6px;
}

.pill-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.field {
  margin-bottom: 18px;
}

.wf--sm {
  font-size: 22px;
  width: 150px;
}

.result-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
  margin-bottom: 10px;
}

.result-label {
  font-family: var(--font-label);
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--red);
}

.method {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.method-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--faint);
}

/* The method bubble sits on the faint tag, not the gold field labels. */
.method .iinfo {
  border-color: var(--faint);
  color: var(--faint);
}

.predictions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pred-label {
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 22px;
  color: var(--ink);
  width: 88px;
  flex-shrink: 0;
}

.pred-time {
  font-family: var(--font-mono);
  font-size: 19px;
  font-weight: 700;
  color: var(--red);
}

.pred-pace {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--on-desk-3);
  width: 74px;
  text-align: right;
}
</style>
