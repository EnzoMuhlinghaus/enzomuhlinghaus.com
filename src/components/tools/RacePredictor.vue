<script setup lang="ts">
import { computed, ref } from 'vue';
import { KM_PER_MI, parseTime, formatTime } from '../../lib/time';
import { vo2Cost, vdotFromRace, timeMinFromVdot, riegelFit } from '../../lib/vdot';
import { useUnit } from '../../lib/units';
import { useMessages } from '../../i18n';
import ToolCard from './ToolCard.vue';

const m = useMessages();
const unit = useUnit();

const ORDER = ['5K', '10K', 'Half', 'Marathon'] as const;
type Dist = (typeof ORDER)[number];
const DIST_KM: Record<Dist, number> = { '5K': 5, '10K': 10, Half: 21.0975, Marathon: 42.195 };
const DEFAULTS: Record<Dist, string> = { '5K': '18:38', '10K': '38:50', Half: '1:27:42', Marathon: '3:42:05' };

/** Where the prediction is derived from. 'two' fits a Riegel curve to two
 *  results; 'engine' takes a measured MAS or VO2max directly. */
type Source = 'race' | 'two' | 'engine';

const source = ref<Source>('race');
const selected = ref<Dist>('10K');
const times = ref<Record<string, string>>({ ...DEFAULTS });
const secondDistance = ref<Dist>('5K');
const secondTimes = ref<Record<string, string>>({});
const engineValue = ref('');
const engineMode = ref<'mas' | 'vo2max'>('mas');
const masFormat = ref<'kmh' | 'minkm'>('kmh');

const distLabel = (k: string) => (k === 'Half' ? m.value.common.half : k);

function selectDistance(k: Dist) {
  selected.value = k;
  if (secondDistance.value === k) secondDistance.value = ORDER.find((x) => x !== k)!;
}

const rawTime = computed({
  get: () => times.value[selected.value] ?? '',
  set: (v: string) => {
    times.value = { ...times.value, [selected.value]: v };
  },
});

const secondTime = computed({
  get: () => secondTimes.value[secondDistance.value] ?? '',
  set: (v: string) => {
    secondTimes.value = { ...secondTimes.value, [secondDistance.value]: v };
  },
});

const seconds = computed(() => parseTime(rawTime.value));
const secondSeconds = computed(() => parseTime(secondTime.value));

// A measured MAS / vVO2max is converted to an equivalent VO2max through the
// same Daniels running-economy curve used for race predictions.
const engine = computed<{ vo2: number | null; masKmh: number | null }>(() => {
  if (source.value !== 'engine') return { vo2: null, masKmh: null };
  if (engineMode.value === 'vo2max') {
    const n = parseFloat(engineValue.value);
    return Number.isFinite(n) && n >= 20 && n <= 95 ? { vo2: n, masKmh: null } : { vo2: null, masKmh: null };
  }
  let kmh: number | null = null;
  if (masFormat.value === 'kmh') {
    const n = parseFloat(engineValue.value);
    if (Number.isFinite(n) && n >= 8 && n <= 26) kmh = n;
  } else {
    const paceSec = parseTime(engineValue.value);
    if (paceSec != null && paceSec > 0) kmh = 3600 / paceSec;
  }
  return kmh != null ? { vo2: vo2Cost((kmh * 1000) / 60), masKmh: kmh } : { vo2: null, masKmh: null };
});

const method = computed<'engine' | 'personalized' | 'default' | null>(() => {
  if (source.value === 'engine') return engine.value.vo2 != null ? 'engine' : null;
  if (source.value === 'two') {
    const ok = secondSeconds.value != null && secondDistance.value !== selected.value && seconds.value != null;
    return ok ? 'personalized' : seconds.value != null ? 'default' : null;
  }
  return seconds.value != null ? 'default' : null;
});

const methodTag = computed(() => {
  switch (method.value) {
    case 'engine':
      return engineMode.value === 'mas' ? m.value.predictor.tagFromMas : m.value.predictor.tagFromVo2;
    case 'personalized':
      return m.value.predictor.tagPersonalized;
    case 'default':
      return m.value.predictor.tagDefault;
    default:
      return '—';
  }
});

const predictions = computed(() => {
  const meth = method.value;
  const riegel =
    meth === 'personalized'
      ? riegelFit(DIST_KM[selected.value], seconds.value!, DIST_KM[secondDistance.value], secondSeconds.value!)
      : null;
  const distInUnit = (km: number) => (unit.value === 'km' ? km : km / KM_PER_MI);

  // With a single race, that distance is an input, not a prediction.
  const shown = ORDER.filter((k) => !(source.value !== 'engine' && k === selected.value));

  return shown.map((k) => {
    let predSeconds: number | null = null;
    if (meth === 'engine') {
      predSeconds = timeMinFromVdot(DIST_KM[k] * 1000, engine.value.vo2!) * 60;
    } else if (meth === 'personalized') {
      predSeconds = Math.exp(riegel!.lnA + riegel!.e * Math.log(DIST_KM[k]));
    } else if (meth === 'default') {
      const vdot = vdotFromRace(DIST_KM[selected.value] * 1000, seconds.value! / 60);
      predSeconds = timeMinFromVdot(DIST_KM[k] * 1000, vdot) * 60;
    }
    return {
      key: k,
      label: distLabel(k),
      time: predSeconds != null ? formatTime(predSeconds) : '—',
      pace: predSeconds != null ? `${formatTime(predSeconds / distInUnit(DIST_KM[k]))}/${unit.value}` : '—',
    };
  });
});

const enginePlaceholder = computed(() => {
  if (engineMode.value === 'vo2max') return m.value.predictor.vo2Placeholder;
  return masFormat.value === 'kmh' ? m.value.predictor.masKmhPlaceholder : m.value.predictor.masPacePlaceholder;
});
</script>

<template>
  <ToolCard no="02" tone="r" :title="m.predictor.title" :subtitle="m.predictor.blurb" :help="m.predictor.help">
    <div class="field-label">{{ m.predictor.predictFrom }}</div>
    <div class="pill-row">
      <button class="pill" :class="{ active: source === 'race' }" @click="source = 'race'">
        {{ m.predictor.sourceRace }}
      </button>
      <button class="pill" :class="{ active: source === 'two' }" @click="source = 'two'">
        {{ m.predictor.sourceTwo }}
      </button>
      <button class="pill" :class="{ active: source === 'engine' }" @click="source = 'engine'">
        {{ m.predictor.sourceEngine }}
      </button>
    </div>

    <template v-if="source !== 'engine'">
      <div class="pill-row">
        <button
          v-for="k in ORDER"
          :key="k"
          class="pill pill--tight"
          :class="{ active: selected === k }"
          @click="selectDistance(k)"
        >
          {{ distLabel(k) }}
        </button>
      </div>
      <div class="field">
        <div class="field-label">{{ m.predictor.yourTimeFor(distLabel(selected)) }}</div>
        <input v-model="rawTime" type="text" class="wf wf--sm" :placeholder="DEFAULTS[selected]" />
      </div>

      <template v-if="source === 'two'">
        <div class="pill-row">
          <button
            v-for="k in ORDER.filter((x) => x !== selected)"
            :key="k"
            class="pill pill--tight"
            :class="{ active: secondDistance === k }"
            @click="secondDistance = k"
          >
            {{ distLabel(k) }}
          </button>
        </div>
        <div class="field">
          <div class="field-label">{{ m.predictor.yourTimeFor(distLabel(secondDistance)) }}</div>
          <input v-model="secondTime" type="text" class="wf wf--sm" :placeholder="DEFAULTS[secondDistance]" />
        </div>
      </template>
    </template>

    <template v-else>
      <div class="pill-row">
        <button class="pill pill--tight" :class="{ active: engineMode === 'mas' }" @click="engineMode = 'mas'">
          {{ m.predictor.masMode }}
        </button>
        <button class="pill pill--tight" :class="{ active: engineMode === 'vo2max' }" @click="engineMode = 'vo2max'">
          VO₂MAX
        </button>
        <template v-if="engineMode === 'mas'">
          <button class="pill pill--tight" :class="{ active: masFormat === 'kmh' }" @click="masFormat = 'kmh'">
            KM/H
          </button>
          <button class="pill pill--tight" :class="{ active: masFormat === 'minkm' }" @click="masFormat = 'minkm'">
            MIN/KM
          </button>
        </template>
      </div>
      <div class="field">
        <div class="field-label">
          {{ engineMode === 'vo2max' ? m.predictor.vo2FieldLabel : m.predictor.masFieldLabel }}
        </div>
        <input v-model="engineValue" type="text" class="wf wf--sm" :placeholder="enginePlaceholder" />
        <p class="caveat">{{ m.predictor.vo2Caveat }}</p>
      </div>
    </template>

    <div class="result-head result-rule">
      <span class="result-label">{{ m.predictor.predicted }}</span>
      <span class="method">
        <span class="method-tag">{{ methodTag }}</span>
        <span class="iinfo" tabindex="0" role="note" :aria-label="m.predictor.vdotHint"
          >?<span class="tip tip--right">{{ m.predictor.vdotHint }}</span></span
        >
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

.pill--tight {
  padding: 7px 13px;
}

.field {
  margin-bottom: 16px;
}

.wf--sm {
  font-size: 22px;
  width: 150px;
}

.caveat {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 16px;
  color: var(--on-desk-3);
  margin: 6px 0 0;
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
