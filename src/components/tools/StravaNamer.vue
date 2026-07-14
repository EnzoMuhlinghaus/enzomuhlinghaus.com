<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMessages } from '../../i18n';

const m = useMessages();

const TYPES = ['Easy', 'Long', 'Tempo', 'Race'] as const;
const TONES = ['Deadpan', 'Punny', 'Poetic'] as const;
type ActivityType = (typeof TYPES)[number];
type Tone = (typeof TONES)[number];

const TYPE_STATS: Record<ActivityType, string> = {
  Easy: '6.2 km · 34:10 · 5:30/km',
  Long: '18.4 km · 1:42:30 · 5:34/km',
  Tempo: '9.1 km · 41:05 · 4:31/km',
  Race: '10.0 km · 38:50 · 3:53/km',
};

const type = ref<ActivityType>('Easy');
const tone = ref<Tone>('Deadpan');
const variants = ref<Record<string, number>>({});
const copied = ref(false);

const comboKey = computed(() => `${type.value}-${tone.value}` as keyof typeof m.value.namer.names);
const result = computed(() => {
  const list = m.value.namer.names[comboKey.value];
  const idx = (variants.value[comboKey.value] ?? 0) % list.length;
  return list[idx]!;
});

function shuffle() {
  const current = variants.value[comboKey.value] ?? 0;
  variants.value = { ...variants.value, [comboKey.value]: current + 1 };
}

function copy() {
  const text = `${result.value.title}\n\n${result.value.desc}`;
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1400);
}
</script>

<template>
  <div class="mono-label section-label">{{ m.namer.activityLabel }}</div>
  <div class="chip-row">
    <button
      v-for="k in TYPES"
      :key="k"
      class="chip"
      :class="{ active: type === k }"
      @click="type = k"
    >
      {{ m.namer.typeLabels[k] }}
    </button>
  </div>

  <div class="mono-label section-label">{{ m.namer.toneLabel }}</div>
  <div class="chip-row">
    <button
      v-for="k in TONES"
      :key="k"
      class="chip tone-chip"
      :class="{ active: tone === k }"
      @click="tone = k"
    >
      {{ m.namer.toneLabels[k] }}
    </button>
  </div>

  <div class="demo-pill">
    <span class="demo-label">{{ m.namer.demoLabel }}</span>
    <span class="demo-stats">{{ TYPE_STATS[type] }}</span>
  </div>

  <div class="result-card">
    <div class="result-head">
      <span class="result-tag">{{ m.namer.typeLabels[type] }} · {{ m.namer.toneLabels[tone] }}</span>
      <div class="actions">
        <button class="icon-btn" :title="m.namer.copyTitle" @click="copy">{{ copied ? '✓' : '⧉' }}</button>
        <button class="icon-btn spin" :title="m.namer.shuffleTitle" @click="shuffle">⟳</button>
      </div>
    </div>
    <div class="result-title">{{ result.title }}</div>
    <div class="result-desc">{{ result.desc }}</div>
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
  margin-bottom: 24px;
}

.tone-chip {
  padding: 10px 20px;
  font-size: 14px;
}

.demo-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-50);
  background: rgba(246, 236, 215, 0.45);
  border: 1px solid rgba(38, 48, 42, 0.2);
  border-radius: 999px;
  padding: 7px 16px;
  margin-bottom: 32px;
}

.demo-label {
  opacity: 0.6;
}

.demo-stats {
  font-weight: 700;
  color: var(--ink);
}

.result-card {
  position: relative;
  border: 1.5px solid var(--ink);
  border-radius: 16px;
  padding: 28px 28px 24px;
  background: var(--cream);
  box-shadow: 0 3px 10px rgba(66, 40, 14, 0.15);
  margin-bottom: 18px;
}

.result-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.result-tag {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--accent);
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 5px 12px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  cursor: pointer;
  border: 1.5px solid var(--ink);
  background: var(--cream);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: transform 0.15s ease;
  color: var(--ink);
}

.icon-btn:hover {
  transform: translateY(-2px);
}

.icon-btn.spin {
  font-size: 16px;
  transition: transform 0.35s ease;
}

.icon-btn.spin:hover {
  transform: rotate(90deg);
}

.result-title {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 34px;
  line-height: 1.15;
  margin-bottom: 12px;
}

.result-desc {
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1.55;
  color: rgba(38, 48, 42, 0.78);
  max-width: 560px;
}
</style>
