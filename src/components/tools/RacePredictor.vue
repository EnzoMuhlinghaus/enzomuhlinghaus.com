<script setup lang="ts">
import { computed, ref } from 'vue';
import { KM_PER_MI, parseTime, formatTime } from '../../lib/time';
import { vo2Cost, vdotFromRace, timeMinFromVdot, riegelFit } from '../../lib/vdot';
import { useLang } from '../../lib/lang';

const lang = useLang();
const fr = computed(() => lang.value === 'fr');

const ORDER = ['5K', '10K', 'Half', 'Marathon'] as const;
type Dist = (typeof ORDER)[number];
const DIST_KM: Record<Dist, number> = { '5K': 5, '10K': 10, Half: 21.0975, Marathon: 42.195 };
const DEFAULTS: Record<Dist, string> = { '5K': '18:38', '10K': '38:50', Half: '1:27:42', Marathon: '3:42:05' };

const selected = ref<Dist>('10K');
const times = ref<Record<string, string>>({ ...DEFAULTS });
const unit = ref<'km' | 'mi'>('km');
const secondOpen = ref(false);
const secondDistance = ref<Dist>('5K');
const secondTimes = ref<Record<string, string>>({});
const vo2Open = ref(false);
const vo2Value = ref('');
const vo2Mode = ref<'mas' | 'vo2max'>('mas');
const masFormat = ref<'kmh' | 'minkm'>('kmh');

const distLabel = (k: string) => (k === 'Half' && fr.value ? 'Semi' : k);

function selectDistance(k: Dist) {
  selected.value = k;
  if (secondDistance.value === k) {
    secondDistance.value = ORDER.find((x) => x !== k)!;
  }
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

// MAS/vVO2max input is converted to an equivalent VO2max via the same
// Daniels running-economy curve used for race predictions.
const vo2Input = computed<{ vo2: number | null; masKmh: number | null }>(() => {
  if (!vo2Open.value) return { vo2: null, masKmh: null };
  if (vo2Mode.value === 'vo2max') {
    const n = parseFloat(vo2Value.value);
    return Number.isFinite(n) && n >= 20 && n <= 95 ? { vo2: n, masKmh: null } : { vo2: null, masKmh: null };
  }
  let kmh: number | null = null;
  if (masFormat.value === 'kmh') {
    const n = parseFloat(vo2Value.value);
    if (Number.isFinite(n) && n >= 8 && n <= 26) kmh = n;
  } else {
    const paceSec = parseTime(vo2Value.value);
    if (paceSec != null && paceSec > 0) kmh = 3600 / paceSec;
  }
  return kmh != null ? { vo2: vo2Cost((kmh * 1000) / 60), masKmh: kmh } : { vo2: null, masKmh: null };
});

const method = computed<'vo2max' | 'personalized' | 'default' | null>(() => {
  const secondValid = secondOpen.value && secondSeconds.value != null && secondDistance.value !== selected.value;
  if (vo2Input.value.vo2 != null) return 'vo2max';
  if (secondValid && seconds.value != null) return 'personalized';
  if (seconds.value != null) return 'default';
  return null;
});

const predictions = computed(() => {
  const m = method.value;
  let riegel: { e: number; lnA: number } | null = null;
  if (m === 'personalized') {
    riegel = riegelFit(DIST_KM[selected.value], seconds.value!, DIST_KM[secondDistance.value], secondSeconds.value!);
  }
  const distInUnit = (km: number) => (unit.value === 'km' ? km : km / KM_PER_MI);

  return ORDER.filter((k) => k !== selected.value).map((k) => {
    let predSeconds: number | null = null;
    let tag = '';
    if (m === 'vo2max') {
      predSeconds = timeMinFromVdot(DIST_KM[k] * 1000, vo2Input.value.vo2!) * 60;
      tag = vo2Mode.value === 'mas' ? (fr.value ? 'VIA MAS' : 'FROM MAS') : (fr.value ? 'VIA VO2MAX' : 'FROM VO2MAX');
    } else if (m === 'personalized') {
      predSeconds = Math.exp(riegel!.lnA + riegel!.e * Math.log(DIST_KM[k]));
      tag = fr.value ? 'PERSONNALISÉ' : 'PERSONALIZED';
    } else if (m === 'default') {
      const vdot = vdotFromRace(DIST_KM[selected.value] * 1000, seconds.value! / 60);
      predSeconds = timeMinFromVdot(DIST_KM[k] * 1000, vdot) * 60;
      tag = fr.value ? 'ESTIMATION' : 'DEFAULT';
    }
    return {
      key: k,
      label: distLabel(k),
      time: predSeconds != null ? formatTime(predSeconds) : '—',
      pace: predSeconds != null ? `${formatTime(predSeconds / distInUnit(DIST_KM[k]))} /${unit.value}` : '—',
      tag,
    };
  });
});

const methodSummary = computed(() => {
  const m = method.value;
  if (m === 'vo2max') {
    return fr.value
      ? `À partir de votre ${vo2Mode.value === 'mas' ? 'VMA' : 'VO2max'}.`
      : `From your ${vo2Mode.value === 'mas' ? 'MAS' : 'VO2max'}.`;
  }
  if (m === 'personalized') {
    return fr.value
      ? `Personnalisé (à partir de vos résultats en ${distLabel(selected.value)} et ${distLabel(secondDistance.value)}).`
      : `Personalized (based on your ${distLabel(selected.value)} and ${distLabel(secondDistance.value)} results).`;
  }
  if (m === 'default') {
    return fr.value
      ? `Basé sur le VDOT (à partir de votre ${distLabel(selected.value)}).`
      : `Based on VDOT (from your ${distLabel(selected.value)}).`;
  }
  return fr.value ? 'Entrez un temps pour commencer.' : 'Enter a time to get started.';
});

const vo2Placeholder = computed(() => {
  if (vo2Mode.value === 'vo2max') return fr.value ? 'ex. 52' : 'e.g. 52';
  return masFormat.value === 'kmh' ? (fr.value ? 'ex. 18.5' : 'e.g. 18.5') : (fr.value ? 'ex. 3:15' : 'e.g. 3:15');
});

const vo2Hint = computed(() => {
  const intro = fr.value
    ? "VO2max : consommation maximale d'oxygène (mL/kg/min). VMA : vitesse maximale aérobie, la vitesse à laquelle le VO2max est atteint — les deux sont liés par l'économie de course."
    : 'VO2max: maximal oxygen uptake (mL/kg/min). MAS: maximal aerobic speed, the pace at which VO2max is reached — the two are linked through running economy.';
  const masKmh = vo2Input.value.masKmh;
  const kmh = masKmh != null ? masKmh : 18;
  const paceStr = `${formatTime(3600 / kmh)}/km`;
  const meters = Math.round(kmh * 100);
  const example =
    masKmh != null
      ? fr.value
        ? ` Une VMA de ${kmh.toFixed(1)} km/h signifie que vous pouvez tenir ${paceStr} pendant ~6 minutes, soit environ ${meters} m.`
        : ` A MAS of ${kmh.toFixed(1)} km/h means that you can hold ${paceStr} for ~6 minutes, or about ${meters} m.`
      : fr.value
        ? ` Par exemple, une VMA de ${kmh} km/h signifie tenir environ ${paceStr} pendant ~6 minutes, soit environ ${meters} m.`
        : ` For example, a MAS of ${kmh} km/h means holding about ${paceStr} for ~6 minutes, or about ${meters} m.`;
  return intro + example;
});
</script>

<template>
  <div class="mono-label section-label">{{ fr ? 'VOTRE TEMPS' : 'YOUR TIME' }}</div>
  <div class="chip-row">
    <button
      v-for="k in ORDER"
      :key="k"
      class="chip"
      :class="{ active: selected === k }"
      @click="selectDistance(k)"
    >
      {{ distLabel(k) }}
    </button>
  </div>
  <div class="time-block">
    <input v-model="rawTime" type="text" class="text-input time-input" :placeholder="DEFAULTS[selected]" />
    <div class="hint">
      {{
        seconds == null
          ? (fr ? 'Format : mm:ss ou h:mm:ss' : 'Format: mm:ss or h:mm:ss')
          : (fr ? 'Modifiez pour votre propre temps' : 'Edit this to your own time')
      }}
    </div>
  </div>

  <!-- progressive disclosure: second race -->
  <div class="disclosure">
    <button class="toggle" @click="secondOpen = !secondOpen">
      <span>{{ secondOpen ? '−' : '+' }}</span>
      <span>{{
        fr
          ? 'Ajouter une autre course récente pour une prédiction plus personnalisée'
          : 'Add another recent race for a more personalized prediction'
      }}</span>
    </button>
    <div v-if="secondOpen" class="drawer">
      <div class="small-chip-row">
        <button
          v-for="k in ORDER.filter((x) => x !== selected)"
          :key="k"
          class="chip second-chip"
          :class="{ active: secondDistance === k }"
          @click="secondDistance = k"
        >
          {{ distLabel(k) }}
        </button>
      </div>
      <input v-model="secondTime" type="text" class="text-input second-input" :placeholder="DEFAULTS[secondDistance]" />
    </div>
  </div>

  <!-- progressive disclosure: VO2max / MAS -->
  <div class="disclosure last">
    <button class="toggle" @click="vo2Open = !vo2Open">
      <span>{{ vo2Open ? '−' : '+' }}</span>
      <span>{{
        fr ? 'Vous avez un VO2max ou une VMA ? Entrez-le directement' : 'Have a VO2max or MAS estimate? Enter it directly'
      }}</span>
    </button>
    <div v-if="vo2Open" class="drawer">
      <div class="small-chip-row">
        <button
          v-for="m in [
            { key: 'mas', label: fr ? 'VMA' : 'MAS' },
            { key: 'vo2max', label: 'VO2MAX' },
          ]"
          :key="m.key"
          class="chip chip--small"
          :class="{ active: vo2Mode === m.key }"
          @click="vo2Mode = m.key as 'mas' | 'vo2max'"
        >
          {{ m.label }}
        </button>
      </div>
      <div class="vo2-row">
        <input v-model="vo2Value" type="text" class="text-input vo2-input" :placeholder="vo2Placeholder" />
        <div v-if="vo2Mode === 'mas'" class="small-chip-row tight">
          <button
            v-for="f in [
              { key: 'kmh', label: 'KM/H' },
              { key: 'minkm', label: 'MIN/KM' },
            ]"
            :key="f.key"
            class="chip chip--small"
            :class="{ active: masFormat === f.key }"
            @click="masFormat = f.key as 'kmh' | 'minkm'"
          >
            {{ f.label }}
          </button>
        </div>
        <span class="caveat">{{ fr ? 'montre, labo ou piste — au choix' : 'watch, lab, or track — any source works' }}</span>
      </div>
      <div class="fine-print">{{ vo2Hint }}</div>
    </div>
  </div>

  <div class="method">{{ methodSummary }}</div>
  <div v-if="method === 'default'" class="fine-print vdot-hint">
    {{
      fr
        ? "VDOT : l'indice de forme de Jack Daniels, calculé à partir de ce résultat de course."
        : "VDOT: Jack Daniels' fitness index, calculated from this race result."
    }}
  </div>

  <div class="head-row">
    <div class="mono-label">{{ fr ? '→ PRÉDICTION' : '→ PREDICTED' }}</div>
    <div class="unit-row">
      <button
        v-for="u in ['km', 'mi'] as const"
        :key="u"
        class="chip chip--small"
        :class="{ active: unit === u }"
        @click="unit = u"
      >
        {{ u.toUpperCase() }}
      </button>
    </div>
  </div>
  <div class="cards">
    <div v-for="pred in predictions" :key="pred.key" class="dashed-panel card">
      <div class="card-head">
        <div class="card-title">{{ pred.label }}</div>
        <span class="card-tag">{{ pred.tag }}</span>
      </div>
      <div class="card-value">{{ pred.time }}</div>
      <div class="card-sub">{{ pred.pace }}</div>
    </div>
  </div>
</template>

<style scoped>
.section-label {
  margin-bottom: 14px;
}

.chip-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.chip-row .chip {
  padding: 12px 24px;
}

.time-block {
  margin-bottom: 24px;
}

.time-input {
  font-size: 28px;
  padding: 14px 20px;
  width: 220px;
}

.hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-50);
  margin-top: 8px;
}

.disclosure {
  margin-bottom: 14px;
}

.disclosure.last {
  margin-bottom: 32px;
}

.toggle {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
}

.drawer {
  margin-top: 12px;
  padding: 16px;
  border: 1.5px dashed rgba(38, 48, 42, 0.3);
  border-radius: 12px;
  background: rgba(246, 236, 215, 0.3);
}

.small-chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.small-chip-row.tight {
  gap: 6px;
  margin-bottom: 0;
}

.second-chip {
  padding: 8px 16px;
  font-size: 13px;
}

.second-input {
  font-size: 18px;
  padding: 9px 14px;
  width: 150px;
  border-radius: 10px;
}

.vo2-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.vo2-input {
  font-size: 14px;
  padding: 9px 14px;
  width: 120px;
  border-radius: 10px;
}

.caveat {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-50);
  max-width: 220px;
}

.fine-print {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: rgba(38, 48, 42, 0.4);
  margin-top: 10px;
  line-height: 1.5;
}

.method {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 18px;
  color: var(--accent);
  margin-bottom: 8px;
}

.vdot-hint {
  margin: 0 0 20px;
  max-width: 520px;
}

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

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 40px;
}

.card {
  padding: 20px;
}

.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-title {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 20px;
}

.card-tag {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--accent);
}

.card-value {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
}

.card-sub {
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(38, 48, 42, 0.55);
  margin-top: 4px;
}

@media (max-width: 640px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
