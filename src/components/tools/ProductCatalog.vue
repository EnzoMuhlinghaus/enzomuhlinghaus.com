<script setup lang="ts">
// Fuel Planner — product catalog region (task t_965bfae3).
//
// Renders the live product list the way the data layer exposes it
// (nutrition-store.ts): `products`, `status`, `error`. Pure props in,
// events out — NO network calls here (the store owns those). Brand gating
// is applied in this component via the config-driven allowlist
// (src/data/nutrition.ts BRAND_ALLOWLIST): products of allowed brands are
// selectable, everything else renders disabled with a "coming soon" hint.
//
// States (mirrors the design's other regions — v-if, NOT v-show):
//   loading — dots + "Loading products…"
//   error   — banner; message depends on the failure class:
//             NETWORK (status 0) → connection message
//             INTERNAL (malformed/5xx) → malformed message
//             other backend codes → server message
//   ready + empty → empty box
//   ready + list  → product rows with a select toggle (allowed brands only)
//
// Selection: emits `update:selected` (array of product ids). Selections are
// PRESERVED across state changes where still valid: when `products` or the
// allowlist changes, ids that are no longer present or no longer allowed are
// pruned; the rest stay selected.
import { computed, ref, watch } from 'vue';
import { useMessages } from '../../i18n';
import { BRAND_ALLOWLIST, type Product } from '../../data/nutrition';
import type { NutritionApiError } from '../../api/client';

const m = useMessages();

const props = withDefaults(
  defineProps<{
    /** Full active catalog (from the data store / fixtures). */
    products: Product[];
    /** Catalog load state — 'idle' renders as loading. */
    status: 'idle' | 'loading' | 'ready' | 'error';
    /** Normalized failure (NutritionApiError) when status === 'error'. */
    error?: NutritionApiError | null;
    /** Brand ids whose products may be selected (defaults to the registry config). */
    allowlist?: readonly string[];
    /** Currently selected product ids (v-model:selected). */
    selected?: readonly string[];
  }>(),
  {
    error: null,
    allowlist: () => BRAND_ALLOWLIST,
    selected: () => [],
  },
);

const emit = defineEmits<{
  'update:selected': [ids: string[]];
}>();

const isLoading = computed(() => props.status === 'idle' || props.status === 'loading');
const isError = computed(() => props.status === 'error');
const isEmpty = computed(() => props.status === 'ready' && props.products.length === 0);

/** Rows gated by the allowlist: allowed brands first, then the rest disabled. */
const rows = computed(() => {
  const allowed = props.products.filter((p) => isAllowed(p.brandId));
  const blocked = props.products.filter((p) => !isAllowed(p.brandId));
  return [...allowed, ...blocked];
});

const isAllowed = (brandId: string) => props.allowlist.includes(brandId);

/** User-facing copy for the current failure — one of the three classes. */
const errorMessageText = computed(() => {
  const e = props.error;
  if (!e) return m.value.nutrition.catalogErrorServer;
  if (e.code === 'NETWORK' || e.status === 0) return m.value.nutrition.catalogErrorNetwork;
  // The client normalizes a non-JSON success body to INTERNAL on a 2xx
  // status; a 4xx/5xx with an unparseable body is a backend failure, not a
  // format problem.
  if (e.code === 'INTERNAL' && e.status < 400) return m.value.nutrition.catalogErrorMalformed;
  return m.value.nutrition.catalogErrorServer;
});

/** Format label for a product row. */
const formatLabel = (f: Product['format']) => m.value.nutrition.catalogFormats[f];

const money = (n: number) => `$${n.toFixed(2)}`;

// --- selection (preserved where valid) ------------------------------------

const selectedIds = ref<string[]>([...props.selected]);

/** Prune selections that are no longer present or no longer allowed. */
function prune() {
  const catalogIds = new Set(props.products.map((p) => p.id));
  const selectableIds = new Set(
    props.products.filter((p) => isAllowed(p.brandId)).map((p) => p.id),
  );
  const kept = selectedIds.value.filter((id) => catalogIds.has(id) && selectableIds.has(id));
  if (kept.length !== selectedIds.value.length) {
    selectedIds.value = kept;
    emit('update:selected', [...kept]);
  }
}

watch(
  () => [props.products, props.allowlist] as const,
  () => {
    prune();
  },
  { deep: true, immediate: true },
);

// External v-model writes (parent replaces the whole selection) win, then
// get pruned to validity. Local toggles never round-trip into a loop because
// the emitted array is identical to what the parent sends back.
watch(
  () => props.selected,
  (next) => {
    const incoming = [...(next ?? [])];
    if (incoming.join('\u0000') !== selectedIds.value.join('\u0000')) {
      selectedIds.value = incoming;
      prune();
    }
  },
  { deep: true },
);

/** Toggle a product's selection. Disabled rows never reach here (template guards). */
function toggle(id: string) {
  const i = selectedIds.value.indexOf(id);
  const next =
    i >= 0
      ? selectedIds.value.filter((x) => x !== id)
      : [...selectedIds.value, id];
  selectedIds.value = next;
  emit('update:selected', [...next]);
}

defineExpose({ selectedIds });
</script>

<template>
  <section class="fp-catalog" aria-label="m.nutrition.catalogTitle">
    <div class="fp-col-title">{{ m.nutrition.catalogTitle }}</div>
    <p class="fp-catalog-sub">{{ m.nutrition.catalogSub }}</p>

    <!-- LOADING -->
    <div v-if="isLoading" class="fp-catalog-state" data-state="loading">
      <p class="b-title">{{ m.nutrition.catalogLoading }}</p>
    </div>

    <!-- ERROR -->
    <div v-else-if="isError" class="fp-catalog-state" data-state="error">
      <div class="fp-errorbox">
        <p class="e-title">{{ m.nutrition.catalogErrorTitle }}</p>
        <p class="e-detail">{{ errorMessageText }}</p>
      </div>
    </div>

    <!-- EMPTY -->
    <div v-else-if="isEmpty" class="fp-catalog-state" data-state="empty">
      <p class="b-title">{{ m.nutrition.catalogEmpty }}</p>
      <p class="b-sub">{{ m.nutrition.catalogEmptySub }}</p>
    </div>

    <!-- READY — product list with brand gating -->
    <ul v-else class="fp-product-list" data-state="ready">
      <li
        v-for="p in rows"
        :key="p.id"
        class="fp-product"
        :class="{ disabled: !isAllowed(p.brandId) }"
      >
        <button
          type="button"
          class="fp-pick"
          :class="{ picked: selectedIds.includes(p.id) }"
          :disabled="!isAllowed(p.brandId)"
          :aria-pressed="selectedIds.includes(p.id)"
          :aria-label="
            selectedIds.includes(p.id)
              ? m.nutrition.catalogDeselect
              : m.nutrition.catalogSelect
          "
          @click="toggle(p.id)"
        >
          <span class="fp-pick-box" aria-hidden="true"></span>
        </button>
        <span class="fp-p-name">{{ p.name }}</span>
        <span class="fp-p-meta mono">{{ formatLabel(p.format) }} · {{ p.carbsG }} g</span>
        <span class="fp-p-price mono">{{ money(p.unitPrice) }}</span>
        <span v-if="!isAllowed(p.brandId)" class="fp-p-tag">{{ m.nutrition.catalogDisabledHint }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.fp-catalog {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1.5px dashed rgba(154, 130, 88, 0.45);
}

.fp-catalog-sub {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 15px;
  color: var(--muted);
  margin: 0 0 10px;
  line-height: 1.2;
}

.fp-catalog-state {
  border: 1.5px dashed rgba(154, 130, 88, 0.55);
  border-radius: 10px;
  padding: 18px 20px;
  text-align: center;
  background: repeating-linear-gradient(
    45deg,
    rgba(246, 239, 221, 0.5) 0 14px,
    rgba(246, 239, 221, 0.9) 14px 28px
  );
}

.fp-catalog-state .b-title {
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 22px;
  color: var(--ink-2);
  margin: 0 0 4px;
}

.fp-catalog-state .b-sub {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 15px;
  color: var(--muted);
  margin: 0;
}

.fp-product-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.fp-product {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
  min-width: 0;
}

.fp-product.disabled {
  opacity: 0.45;
}

.fp-pick {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  display: inline-flex;
}

.fp-pick:disabled {
  cursor: not-allowed;
}

.fp-pick-box {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--gold);
  border-radius: 4px;
  background: rgba(246, 239, 221, 0.6);
  transition: background 0.15s ease;
}

.fp-pick.picked .fp-pick-box {
  background: var(--red);
  border-color: var(--red);
  box-shadow: inset 0 0 0 2px rgba(246, 239, 221, 0.9);
}

.fp-p-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fp-p-meta {
  font-size: 10px;
  color: var(--faint);
  white-space: nowrap;
}

.fp-p-price {
  font-size: 13px;
  color: var(--ink-2);
  margin-left: auto;
  white-space: nowrap;
}

.fp-p-tag {
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.1em;
  color: var(--gold);
  border: 1px solid rgba(154, 130, 88, 0.5);
  border-radius: 999px;
  padding: 1px 7px;
  white-space: nowrap;
}

.mono {
  font-family: var(--font-mono);
}
</style>
