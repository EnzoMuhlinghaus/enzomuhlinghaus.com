<script setup lang="ts">
import { computed, ref } from 'vue';
import { KM_PER_MI, parseTime, formatTime } from '../../lib/time';
import { vdotFromRace, velocityAtVO2max } from '../../lib/vdot';
import { useMessages } from '../../i18n';

const m = useMessages();

const ORDER = ['1 Mile', '3K', '5K', '10K', '15K', 'Half', 'Marathon', '50K'] as const;
const DIST_KM: Record<string, number> = {
  '1 Mile': 1.60934,
  '3K': 3,
  '5K': 5,
  '10K': 10,
  '15K': 15,
  Half: 21.0975,
  Marathon: 42.195,
  '50K': 50,
};
const DEFAULTS: Record<string, string> = {
  '1 Mile': '5:35',
  '3K': '11:10',
  '5K': '18:38',
  '10K': '38:50',
  '15K': '59:30',
  Half: '1:27:42',
  Marathon: '3:42:05',
  '50K': '4:15:00',
};

const ZONE_PCTS = [
  { key: 'easy', pct: 0.7 },
  { key: 'marathon', pct: 0.8 },
  { key: 'threshold', pct: 0.88 },
  { key: 'vo2max', pct: 0.98 },
] as const;

const selected = ref<string>('10K');
const times = ref<Record<string, string>>({ ...DEFAULTS });
const unit = ref<'km' | 'mi'>('km');

const distLabel = (k: string) => (k === 'Half' ? m.value.common.half : k);

const rawTime = computed({
  get: () => times.value[selected.value] ?? '',
  set: (v: string) => {
    times.value = { ...times.value, [selected.value]: v };
  },
});

const seconds = computed(() => parseTime(rawTime.value));

const vdot = computed(() => {
  if (seconds.value == null) return null;
  return vdotFromRace(DIST_KM[selected.value]! * 1000, seconds.value / 60);
});

const masKmh = computed(() => {
  if (vdot.value == null) return null;
  return (velocityAtVO2max(vdot.value) * 60) / 1000;
});

function speedToPaceStr(kmh: number): string {
  const speedInUnit = unit.value === 'km' ? kmh : kmh / KM_PER_MI;
  return `${formatTime(3600 / speedInUnit)}/${unit.value}`;
}

const zones = computed(() => {
  if (masKmh.value == null) return [];
  return ZONE_PCTS.map((z) => ({
    key: z.key,
    name: m.value.mas.zones[z.key],
    pct: `${Math.round(z.pct * 100)}% ${m.value.mas.masLabel}`,
    pace: speedToPaceStr(masKmh.value! * z.pct),
  }));
});
</script>

<template>
  <div class="mono-label section-label">{{ m.common.yourTime }}</div>
  <div class="chip-row">
    <button
      v-for="k in ORDER"
      :key="k"
      class="chip"
      :class="{ active: selected === k }"
      @click="selected = k"
    >
      {{ distLabel(k) }}
    </button>
  </div>
  <div class="time-block">
    <input v-model="rawTime" type="text" class="text-input time-input" :placeholder="DEFAULTS[selected]" />
    <div class="hint">
      {{ seconds == null ? m.common.formatHint : m.common.editHint }}
    </div>
  </div>

  <div class="head-row">
    <div class="mono-label">{{ m.mas.estimated }}</div>
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
    <div class="dashed-panel card">
      <div class="card-title">VDOT</div>
      <div class="card-value">{{ vdot != null ? vdot.toFixed(1) : '—' }}</div>
    </div>
    <div class="dashed-panel card">
      <div class="card-title">VO2max</div>
      <div class="card-value">{{ vdot != null ? vdot.toFixed(1) : '—' }}</div>
      <div class="card-sub">mL/kg/min</div>
    </div>
    <div class="dashed-panel card">
      <div class="card-title">{{ m.mas.masLabel }}</div>
      <div class="card-value">{{ masKmh != null ? `${masKmh.toFixed(1)} km/h` : '—' }}</div>
      <div class="card-sub">{{ masKmh != null ? speedToPaceStr(masKmh) : '' }}</div>
    </div>
  </div>

  <div class="mono-label section-label">{{ m.mas.zonesTitle }}</div>
  <div v-if="zones.length" class="zones">
    <div v-for="zone in zones" :key="zone.key" class="zone">
      <div class="zone-name-wrap">
        <span class="zone-name">{{ zone.name }}</span>
        <span class="zone-pct">{{ zone.pct }}</span>
      </div>
      <span class="zone-pace">{{ zone.pace }}</span>
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
  margin-bottom: 36px;
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
  margin-bottom: 36px;
}

.card {
  padding: 20px;
}

.card-title {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 20px;
  margin-bottom: 8px;
}

.card-value {
  font-family: var(--font-mono);
  font-size: 26px;
  font-weight: 700;
}

.card-sub {
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(38, 48, 42, 0.55);
  margin-top: 4px;
}

.zones {
  display: flex;
  flex-direction: column;
  margin-bottom: 28px;
  border: 1.5px solid var(--ink);
  border-radius: 12px;
  overflow: hidden;
}

.zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: rgba(246, 236, 215, 0.4);
}

.zone + .zone {
  border-top: 1px solid rgba(38, 48, 42, 0.15);
}

.zone-name-wrap {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.zone-name {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 17px;
}

.zone-pct {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-50);
}

.zone-pace {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
}

@media (max-width: 640px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
