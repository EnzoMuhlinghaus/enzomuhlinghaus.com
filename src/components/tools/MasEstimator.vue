<script setup lang="ts">
import { computed, ref } from 'vue';
import { KM_PER_MI, parseTime, formatTime } from '../../lib/time';
import { vo2Cost, vdotFromRace, velocityAtVO2max } from '../../lib/vdot';
import { useUnit } from '../../lib/units';
import { useMessages } from '../../i18n';
import ToolCard from './ToolCard.vue';
import HelpBubble from './HelpBubble.vue';

const m = useMessages();
const unit = useUnit();

const ORDER = ['1500m', '1 Mile', '3000m', '5K', '10K', 'Half', 'Marathon'] as const;
const DIST_KM: Record<string, number> = {
  '1500m': 1.5,
  '1 Mile': 1.609344,
  '3000m': 3,
  '5K': 5,
  '10K': 10,
  Half: 21.0975,
  Marathon: 42.195,
};
const DEFAULTS: Record<string, string> = {
  '1500m': '4:45',
  '1 Mile': '5:05',
  '3000m': '10:20',
  '5K': '18:38',
  '10K': '38:50',
  Half: '1:27:42',
  Marathon: '3:42:05',
};

const ZONE_PCTS = [
  { key: 'easy', pct: 0.7 },
  { key: 'marathon', pct: 0.8 },
  { key: 'threshold', pct: 0.88 },
  { key: 'vo2max', pct: 0.98 },
] as const;

type Protocol = 'demi' | 'cooper' | 'leger';
const PROTOCOLS: Protocol[] = ['demi', 'cooper', 'leger'];
const TEST_DEFAULTS: Record<Protocol, string> = { demi: '1600', cooper: '2800', leger: '14.5' };
const TEST_WIKI: Record<Protocol, string> = {
  demi: 'https://en.wikipedia.org/wiki/Cooper_test',
  cooper: 'https://en.wikipedia.org/wiki/Cooper_test',
  leger: 'https://en.wikipedia.org/wiki/Multi-stage_fitness_test',
};

const source = ref<'race' | 'test'>('race');
const selected = ref<string>('10K');
const times = ref<Record<string, string>>({ ...DEFAULTS });
const protocol = ref<Protocol>('demi');
const tests = ref<Record<Protocol, string>>({ ...TEST_DEFAULTS });

const distLabel = (k: string) => (k === 'Half' ? m.value.common.half : k);

const rawTime = computed({
  get: () => times.value[selected.value] ?? '',
  set: (v: string) => {
    times.value = { ...times.value, [selected.value]: v };
  },
});

const testValue = computed({
  get: () => tests.value[protocol.value],
  set: (v: string) => {
    tests.value = { ...tests.value, [protocol.value]: v };
  },
});

/** MAS in km/h, from whichever source is active. */
const masKmh = computed<number | null>(() => {
  if (source.value === 'race') {
    const seconds = parseTime(rawTime.value);
    if (seconds == null) return null;
    const vdot = vdotFromRace(DIST_KM[selected.value]! * 1000, seconds / 60);
    return (velocityAtVO2max(vdot) * 60) / 1000;
  }
  const raw = parseFloat(testValue.value);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  // 6-min half-Cooper: metres covered ÷ 100 is MAS in km/h by construction.
  if (protocol.value === 'demi') return raw / 100;
  // 12-min Cooper: the classic distance→VO2max regression, then back to speed.
  if (protocol.value === 'cooper') {
    const vo2 = (raw - 504.9) / 44.73;
    return vo2 > 0 ? (velocityAtVO2max(vo2) * 60) / 1000 : null;
  }
  // Beep test: the final completed stage's speed is taken as MAS directly.
  return raw;
});

const vo2max = computed(() => (masKmh.value == null ? null : vo2Cost((masKmh.value * 1000) / 60)));

const masPace = computed(() => (masKmh.value == null ? '—' : `${formatTime(3600 / masKmh.value)}/km`));

function speedToPaceStr(kmh: number): string {
  const speedInUnit = unit.value === 'km' ? kmh : kmh / KM_PER_MI;
  return `${formatTime(3600 / speedInUnit)}/${unit.value}`;
}

const zones = computed(() =>
  ZONE_PCTS.map((z) => ({
    key: z.key,
    name: m.value.mas.zones[z.key],
    info: m.value.mas.zoneInfo[z.key],
    pct: `${Math.round(z.pct * 100)}% ${m.value.mas.masLabel}`,
    pace: masKmh.value == null ? '—' : speedToPaceStr(masKmh.value * z.pct),
  })),
);
</script>

<template>
  <ToolCard
    no="03"
    tone="r"
    anchor="mas-vo2max"
    :title="m.mas.title"
    :subtitle="m.mas.blurb"
    :help="m.mas.help"
  >
    <div class="field-label">{{ m.mas.measureFrom }}</div>
    <div class="pill-row">
      <button class="pill" :class="{ active: source === 'race' }" :aria-pressed="source === 'race'" @click="source = 'race'">
        {{ m.mas.sourceRace }}
      </button>
      <button class="pill" :class="{ active: source === 'test' }" :aria-pressed="source === 'test'" @click="source = 'test'">
        {{ m.mas.sourceTest }}
      </button>
    </div>

    <template v-if="source === 'race'">
      <div class="pill-row">
        <button
          v-for="k in ORDER"
          :key="k"
          class="pill pill--tight"
          :class="{ active: selected === k }"
          :aria-pressed="selected === k"
          @click="selected = k"
        >
          {{ distLabel(k) }}
        </button>
      </div>
      <div class="field">
        <div class="field-label">{{ m.mas.yourTimeFor(distLabel(selected)) }}</div>
        <input v-model="rawTime" type="text" class="wf wf--sm" :placeholder="DEFAULTS[selected]" />
      </div>
    </template>

    <template v-else>
      <div class="pill-row">
        <button
          v-for="p in PROTOCOLS"
          :key="p"
          class="pill pill--tight"
          :class="{ active: protocol === p }"
          :aria-pressed="protocol === p"
          @click="protocol = p"
        >
          {{ m.mas.protocols[p] }}
        </button>
      </div>
      <div class="field">
        <div class="field-label">{{ m.mas.testLabels[protocol] }}</div>
        <div class="test-row">
          <input v-model="testValue" type="text" class="wf wf--sm" :placeholder="TEST_DEFAULTS[protocol]" />
          <p class="test-hint">
            {{ m.mas.testHints[protocol] }}
            <a :href="TEST_WIKI[protocol]" target="_blank" rel="noopener">{{ m.mas.whatsThis }}</a>
          </p>
        </div>
      </div>
    </template>

    <div class="readout result-rule">
      <div>
        <div class="readout-label">
          <span>{{ m.mas.vo2Label }}</span>
          <HelpBubble :text="m.mas.vo2Info" size="sm" />
        </div>
        <div class="readout-value">
          <strong>{{ vo2max == null ? '—' : vo2max.toFixed(1) }}</strong>
          <span class="unit">mL/kg/min</span>
        </div>
      </div>
      <div>
        <div class="readout-label">
          <span>{{ m.mas.masLabel }}</span>
          <HelpBubble :text="m.mas.masInfo" size="sm" />
        </div>
        <div class="readout-value">
          <strong>{{ masKmh == null ? '—' : masKmh.toFixed(1) }}</strong>
          <span class="unit">km/h</span>
        </div>
        <div class="readout-pace">{{ masPace }}</div>
      </div>
    </div>

    <div class="field-label zones-title">{{ m.mas.zonesTitle }}</div>
    <div class="zones">
      <div v-for="z in zones" :key="z.key" class="leader zone">
        <span class="zone-name">
          <span>{{ z.name }}</span>
          <HelpBubble :text="z.info" size="sm" />
        </span>
        <span class="zone-pct">{{ z.pct }}</span>
        <span class="leader__fill" />
        <span class="zone-pace">{{ z.pace }}</span>
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

.test-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.test-hint {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 16px;
  color: var(--on-desk-3);
  line-height: 1.25;
  margin: 0;
  flex: 1;
  min-width: 150px;
}

.test-hint a {
  color: var(--red);
  border-bottom: 1.5px solid rgba(193, 68, 46, 0.4);
  white-space: nowrap;
}

.readout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding-top: 14px;
  margin-bottom: 14px;
}

.readout-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-label);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--red);
  margin-bottom: 4px;
}

.readout-value {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.readout-value strong {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--red);
}

.unit,
.readout-pace {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--on-desk-3);
}

.readout-pace {
  font-size: 12px;
  margin-top: 2px;
}

.zones-title {
  letter-spacing: 0.16em;
  margin-bottom: 8px;
}

.zones {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.zone-name {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 112px;
  flex-shrink: 0;
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 19px;
  color: var(--ink);
}

.zone-pct {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--faint);
  width: 58px;
  flex-shrink: 0;
}

.zone-pace {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
}

@media (max-width: 560px) {
  .readout {
    grid-template-columns: 1fr;
  }
}
</style>
