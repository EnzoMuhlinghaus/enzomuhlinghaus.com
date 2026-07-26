<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMessages } from '../../i18n';
import ToolCard from './ToolCard.vue';

const m = useMessages();

const TYPES = ['Easy', 'Long', 'Tempo', 'Race'] as const;
const TONES = ['Deadpan', 'Punny', 'Poetic'] as const;
type ActivityType = (typeof TYPES)[number];
type Tone = (typeof TONES)[number];

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
  <ToolCard no="04" tone="l" :title="m.namer.title" :subtitle="m.namer.blurb" :help="m.namer.help">
    <div class="field-label">{{ m.namer.activityLabel }}</div>
    <div class="pill-row">
      <button v-for="k in TYPES" :key="k" class="pill" :class="{ active: type === k }" @click="type = k">
        {{ m.namer.typeLabels[k] }}
      </button>
    </div>

    <div class="field-label">{{ m.namer.toneLabel }}</div>
    <div class="pill-row pill-row--last">
      <button v-for="k in TONES" :key="k" class="pill" :class="{ active: tone === k }" @click="tone = k">
        {{ m.namer.toneLabels[k] }}
      </button>
    </div>

    <div class="output">
      <div class="output-head">
        <span class="tag">{{ m.namer.typeLabels[type] }} · {{ m.namer.toneLabels[tone] }}</span>
        <div class="actions">
          <button class="icon-btn" :title="m.namer.copyTitle" :aria-label="m.namer.copyTitle" @click="copy">
            {{ copied ? '✓' : '⧉' }}
          </button>
          <button
            class="icon-btn shuffle"
            :title="m.namer.shuffleTitle"
            :aria-label="m.namer.shuffleTitle"
            @click="shuffle"
          >
            ↻
          </button>
        </div>
      </div>
      <div class="output-title">{{ result.title }}</div>
      <div class="output-desc">{{ result.desc }}</div>
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
  margin-bottom: 12px;
}

.pill-row--last {
  margin-bottom: 18px;
}

.pill-row .pill {
  padding: 7px 13px;
}

.output {
  background: var(--paper-bright);
  border: 1.5px solid var(--ink);
  border-radius: 10px;
  padding: 18px 20px;
}

.output-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.tag {
  font-family: var(--font-label);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--red);
  border: 1.5px solid var(--red);
  border-radius: 999px;
  padding: 4px 10px;
}

.actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.icon-btn {
  cursor: pointer;
  border: 1.5px solid var(--ink);
  background: var(--paper-bright);
  border-radius: 7px;
  width: 32px;
  height: 32px;
  font-size: 15px;
  color: var(--ink);
  transition: transform 0.35s ease;
}

.icon-btn:focus-visible {
  outline: 2px solid var(--red);
  outline-offset: 2px;
}

.shuffle:hover {
  transform: rotate(90deg);
}

.output-title {
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 30px;
  line-height: 1.05;
  color: var(--ink);
  margin-bottom: 8px;
}

.output-desc {
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink-2);
}
</style>
