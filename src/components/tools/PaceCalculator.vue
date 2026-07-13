<script setup lang="ts">
import { computed, ref } from 'vue';
import { KM_PER_MI, parseTime, formatTime } from '../../lib/time';
import { useLang } from '../../lib/lang';

const lang = useLang();
const fr = computed(() => lang.value === 'fr');

type Mode = 'pace' | 'time' | 'distance';

const QUICK_DIST_KM: Record<string, number> = {
  '100m': 0.1,
  '200m': 0.2,
  '400m': 0.4,
  '800m': 0.8,
  '1500m': 1.5,
  '3000m': 3,
  '5K': 5,
  '10K': 10,
  Half: 21.0975,
  Marathon: 42.195,
};

const MODES: { key: Mode; en: string; fr: string }[] = [
  { key: 'pace', en: 'Find Pace', fr: "Trouver l'Allure" },
  { key: 'time', en: 'Find Time', fr: 'Trouver le Temps' },
  { key: 'distance', en: 'Find Distance', fr: 'Trouver la Distance' },
];

const mode = ref<Mode>('pace');
const unit = ref<'km' | 'mi'>('km');
const distanceValue = ref('10');
const timeValue = ref('40:00');
const paceValue = ref('4:00');

function setUnit(u: 'km' | 'mi') {
  if (unit.value === u) return;
  const distNum = parseFloat(distanceValue.value);
  if (Number.isFinite(distNum)) {
    distanceValue.value = (u === 'mi' ? distNum / KM_PER_MI : distNum * KM_PER_MI).toFixed(2);
  }
  const paceSec = parseTime(paceValue.value);
  if (paceSec != null) {
    paceValue.value = formatTime(u === 'mi' ? paceSec * KM_PER_MI : paceSec / KM_PER_MI);
  }
  unit.value = u;
}

function setQuickDist(key: string) {
  const km = QUICK_DIST_KM[key]!;
  const val = unit.value === 'km' ? km : km / KM_PER_MI;
  distanceValue.value = val.toFixed(2);
}

const result = computed(() => {
  const distanceNum = parseFloat(distanceValue.value);
  const distanceValid = Number.isFinite(distanceNum) && distanceNum > 0;
  const timeSec = parseTime(timeValue.value);
  const paceSec = parseTime(paceValue.value);
  const u = unit.value;

  if (mode.value === 'pace') {
    if (distanceValid && timeSec != null) {
      const paceResultSec = timeSec / distanceNum;
      const speedPerUnit = 3600 / paceResultSec;
      const speedKmh = u === 'km' ? speedPerUnit : speedPerUnit * KM_PER_MI;
      return { value: `${formatTime(paceResultSec)} /${u}`, sub: `≈ ${speedKmh.toFixed(1)} km/h` };
    }
    return { value: '—', sub: '' };
  }
  if (mode.value === 'time') {
    return { value: distanceValid && paceSec != null ? formatTime(paceSec * distanceNum) : '—', sub: '' };
  }
  return {
    value: timeSec != null && paceSec != null && paceSec > 0 ? `${(timeSec / paceSec).toFixed(2)} ${u}` : '—',
    sub: '',
  };
});

const resultLabel = computed(() => {
  if (mode.value === 'pace') return fr.value ? '→ ALLURE' : '→ PACE';
  if (mode.value === 'time') return fr.value ? '→ TEMPS' : '→ TIME';
  return fr.value ? '→ DISTANCE' : '→ DISTANCE';
});
</script>

<template>
  <div class="head-row">
    <div class="mono-label">{{ fr ? 'CALCULER' : 'SOLVE FOR' }}</div>
    <div class="unit-row">
      <button
        v-for="u in ['km', 'mi'] as const"
        :key="u"
        class="chip chip--small"
        :class="{ active: unit === u }"
        @click="setUnit(u)"
      >
        {{ u.toUpperCase() }}
      </button>
    </div>
  </div>

  <div class="mode-row">
    <button
      v-for="m in MODES"
      :key="m.key"
      class="chip"
      :class="{ active: mode === m.key }"
      @click="mode = m.key"
    >
      {{ fr ? m.fr : m.en }}
    </button>
  </div>

  <div class="fields">
    <div v-if="mode !== 'distance'">
      <div class="mono-label field-label">DISTANCE ({{ unit.toUpperCase() }})</div>
      <input
        v-model="distanceValue"
        type="text"
        class="text-input"
        :placeholder="unit === 'km' ? '10' : '6.2'"
      />
      <div class="quick-row">
        <button v-for="(km, k) in QUICK_DIST_KM" :key="k" class="chip chip--ghost" @click="setQuickDist(String(k))">
          {{ k === 'Half' && fr ? 'Semi' : k }}
        </button>
      </div>
    </div>
    <div v-if="mode !== 'time'">
      <div class="mono-label field-label">{{ fr ? 'TEMPS' : 'TIME' }}</div>
      <input v-model="timeValue" type="text" class="text-input" placeholder="40:00" />
    </div>
    <div v-if="mode !== 'pace'">
      <div class="mono-label field-label">{{ fr ? 'ALLURE' : 'PACE' }} (/{{ unit.toUpperCase() }})</div>
      <input v-model="paceValue" type="text" class="text-input" placeholder="4:00" />
    </div>
  </div>

  <div class="dashed-panel result">
    <div class="mono-label">{{ resultLabel }}</div>
    <div class="result-value-wrap">
      <div class="result-value">{{ result.value }}</div>
      <div v-if="result.sub" class="result-sub">{{ result.sub }}</div>
    </div>
  </div>
</template>

<style scoped>
.head-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.unit-row {
  display: flex;
  gap: 8px;
}

.mode-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.field-label {
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.quick-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.result {
  border-radius: 14px;
  padding: 24px 28px;
  margin-bottom: 28px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.result-value-wrap {
  text-align: right;
}

.result-value {
  font-family: var(--font-mono);
  font-size: 38px;
  font-weight: 700;
}

.result-sub {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink-50);
  margin-top: 2px;
}

@media (max-width: 640px) {
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>
