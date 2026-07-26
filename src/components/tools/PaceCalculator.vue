<script setup lang="ts">
import { computed, ref } from 'vue';
import { KM_PER_MI, parseTime, formatTime } from '../../lib/time';
import { useUnit } from '../../lib/units';
import { useMessages } from '../../i18n';
import ToolCard from './ToolCard.vue';

const m = useMessages();
const unit = useUnit();

type Mode = 'pace' | 'time' | 'distance';
const MODES: Mode[] = ['pace', 'time', 'distance'];

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

const mode = ref<Mode>('pace');
const distanceValue = ref('21.10');
const timeValue = ref('1:27:42');
const paceValue = ref('4:09');

// The masthead owns the unit, so convert the entered values when it flips —
// otherwise "21.10" would silently change meaning.
function convertTo(u: 'km' | 'mi') {
  const distNum = parseFloat(distanceValue.value);
  if (Number.isFinite(distNum)) {
    distanceValue.value = (u === 'mi' ? distNum / KM_PER_MI : distNum * KM_PER_MI).toFixed(2);
  }
  const paceSec = parseTime(paceValue.value);
  if (paceSec != null) {
    paceValue.value = formatTime(u === 'mi' ? paceSec * KM_PER_MI : paceSec / KM_PER_MI);
  }
}
defineExpose({ convertTo });

function setQuickDist(key: string) {
  const km = QUICK_DIST_KM[key]!;
  distanceValue.value = (unit.value === 'km' ? km : km / KM_PER_MI).toFixed(2);
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
      return { value: `${formatTime(paceResultSec)}/${u}`, sub: `≈ ${speedKmh.toFixed(1)} km/h` };
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
  if (mode.value === 'pace') return m.value.pace.resultPace;
  if (mode.value === 'time') return m.value.pace.resultTime;
  return m.value.pace.resultDistance;
});
</script>

<template>
  <ToolCard no="01" tone="l" :title="m.pace.title" :subtitle="m.pace.blurb" :help="m.pace.help">
    <div class="pill-row">
      <button v-for="k in MODES" :key="k" class="pill" :class="{ active: mode === k }" @click="mode = k">
        {{ m.pace.modes[k] }}
      </button>
    </div>

    <div class="fields">
      <div v-if="mode !== 'distance'">
        <div class="field-label">{{ m.pace.distanceLabel }} ({{ unit.toUpperCase() }})</div>
        <input v-model="distanceValue" type="text" class="wf" placeholder="10" />
      </div>
      <div v-if="mode !== 'time'">
        <div class="field-label">{{ m.pace.timeLabel }}</div>
        <input v-model="timeValue" type="text" class="wf" placeholder="40:00" />
      </div>
      <div v-if="mode !== 'pace'">
        <div class="field-label">{{ m.pace.paceLabel }} (/{{ unit.toUpperCase() }})</div>
        <input v-model="paceValue" type="text" class="wf" placeholder="4:00" />
      </div>
    </div>

    <div v-if="mode !== 'distance'" class="chip-row">
      <button v-for="(km, k) in QUICK_DIST_KM" :key="k" class="chip" @click="setQuickDist(String(k))">
        {{ k === 'Half' ? m.common.half : k }}
      </button>
    </div>

    <div class="result result-rule">
      <span class="result-label">{{ resultLabel }}</span>
      <span class="result-value">{{ result.value }}</span>
    </div>
    <div v-if="result.sub" class="result-sub">{{ result.sub }}</div>
  </ToolCard>
</template>

<style scoped>
.pill-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.pill-row .pill {
  font-size: 9.5px;
  padding: 6px 11px;
}

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}

.field-label {
  font-family: var(--font-label);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--gold);
  margin-bottom: 6px;
}

.wf {
  font-size: 20px;
  width: 100%;
}

.chip-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 14px;
}

.result-label {
  font-family: var(--font-label);
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--red);
}

.result-value {
  font-family: var(--font-mono);
  font-size: 30px;
  font-weight: 700;
  color: var(--red);
  white-space: nowrap;
}

.result-sub {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 17px;
  color: var(--on-desk-3);
  text-align: right;
  margin-top: 6px;
}

@media (max-width: 560px) {
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>
