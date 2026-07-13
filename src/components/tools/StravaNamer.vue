<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLang } from '../../lib/lang';

const lang = useLang();
const fr = computed(() => lang.value === 'fr');

const TYPES = ['Easy', 'Long', 'Tempo', 'Race'] as const;
const TONES = ['Deadpan', 'Punny', 'Poetic'] as const;
type ActivityType = (typeof TYPES)[number];
type Tone = (typeof TONES)[number];

const TYPE_LABEL: Record<string, Record<ActivityType, string>> = {
  en: { Easy: 'Easy', Long: 'Long', Tempo: 'Tempo', Race: 'Race' },
  fr: { Easy: 'Footing', Long: 'Sortie longue', Tempo: 'Tempo', Race: 'Course' },
};
const TONE_LABEL: Record<string, Record<Tone, string>> = {
  en: { Deadpan: 'Deadpan', Punny: 'Punny', Poetic: 'Poetic' },
  fr: { Deadpan: 'Flegmatique', Punny: 'Jeux de mots', Poetic: 'Poétique' },
};
const TYPE_STATS: Record<ActivityType, string> = {
  Easy: '6.2 km · 34:10 · 5:30/km',
  Long: '18.4 km · 1:42:30 · 5:34/km',
  Tempo: '9.1 km · 41:05 · 4:31/km',
  Race: '10.0 km · 38:50 · 3:53/km',
};

interface NameEntry {
  title: string;
  desc: string;
}

const NAMES: Record<string, Record<string, NameEntry[]>> = {
  en: {
    'Easy-Deadpan': [
      { title: 'Easy Run', desc: 'Kept the heart rate low and the effort lower.' },
      { title: 'Recovery Pace, Allegedly', desc: 'Legs said easy. Watch agreed. Mostly.' },
    ],
    'Easy-Punny': [
      { title: 'Jog On', desc: "A gentle plod, powered by yesterday's pasta." },
      { title: 'Low Key, High Mileage', desc: 'Kept the effort chill and the vibes chiller.' },
    ],
    'Easy-Poetic': [
      { title: 'Quiet Miles', desc: 'Nothing to prove, everything to notice.' },
      { title: 'Soft Light, Softer Pace', desc: 'Some runs are for legs. This one was for the mind.' },
    ],
    'Long-Deadpan': [
      { title: 'Long Run', desc: 'Went far. Came back. Ate everything.' },
      { title: 'Sunday Miles', desc: 'Started tired, finished tireder.' },
    ],
    'Long-Punny': [
      { title: 'Going the Extra Klicks', desc: 'Signed up for long, stayed for longer.' },
      { title: 'Marathon Rehearsal', desc: 'Dress rehearsal for the real thing, minus the crowd.' },
    ],
    'Long-Poetic': [
      { title: 'Miles Add Up Quietly', desc: 'Each kilometer a small negotiation with doubt.' },
      { title: 'The Long Way Round', desc: 'Some days the destination is just more road.' },
    ],
    'Tempo-Deadpan': [
      { title: 'Tempo Run', desc: 'Uncomfortable on purpose.' },
      { title: 'Threshold, Reached', desc: 'Breathing got loud around kilometer four.' },
    ],
    'Tempo-Punny': [
      { title: 'Tempo Tantrum', desc: "Legs protested. Watch didn't care." },
      { title: 'Speed Wobbles', desc: 'Fast start, honest middle, hung on at the end.' },
    ],
    'Tempo-Poetic': [
      { title: 'Where Discomfort Lives', desc: 'Found the edge and ran along it.' },
      { title: 'Held Pace, Barely', desc: 'Discipline measured in seconds per kilometer.' },
    ],
    'Race-Deadpan': [
      { title: 'Race Day', desc: 'Ran further than training suggested I should.' },
      { title: 'PB, Barely', desc: "One second under the old best. I'll take it." },
    ],
    'Race-Punny': [
      { title: 'Personal Best, Personal Mess', desc: 'Nailed the finish. Questioned every choice before it.' },
      { title: 'Sub Goals Achieved', desc: 'Broke the barrier. Broke a little of myself too.' },
    ],
    'Race-Poetic': [
      { title: 'Every Second Counted', desc: 'Months of quiet mornings, spent in nineteen minutes.' },
      { title: 'Finish Line, Finally', desc: 'Crossed it and felt every one of the kilometers behind it.' },
    ],
  },
  fr: {
    'Easy-Deadpan': [
      { title: 'Footing Tranquille', desc: 'Rythme cardiaque bas, effort plus bas encore.' },
      { title: 'Récup, en Théorie', desc: 'Les jambes ont dit facile. La montre a validé. Presque.' },
    ],
    'Easy-Punny': [
      { title: 'Mode Pépère', desc: "Trottiné tranquille, alimenté aux pâtes d'hier." },
      { title: 'Zen et Kilométrage', desc: 'Effort cool, ambiance encore plus cool.' },
    ],
    'Easy-Poetic': [
      { title: 'Kilomètres Silencieux', desc: 'Rien à prouver, tout à observer.' },
      { title: 'Lumière Douce, Allure Plus Douce', desc: 'Certaines sorties sont pour les jambes. Celle-ci, pour la tête.' },
    ],
    'Long-Deadpan': [
      { title: 'Sortie Longue', desc: 'Parti loin. Revenu. Tout mangé.' },
      { title: 'Les Kilomètres du Dimanche', desc: 'Parti fatigué, arrivé plus fatigué encore.' },
    ],
    'Long-Punny': [
      { title: 'Les Kilomètres en Rab', desc: 'Inscrit pour long, resté pour plus long encore.' },
      { title: 'Répétition Marathon', desc: 'Répétition générale, sans le public.' },
    ],
    'Long-Poetic': [
      { title: "Les Kilomètres s'Accumulent", desc: 'Chaque kilomètre, une petite négociation avec le doute.' },
      { title: 'Le Chemin des Écoliers', desc: "Certains jours, la destination c'est juste plus de route." },
    ],
    'Tempo-Deadpan': [
      { title: 'Séance Tempo', desc: 'Inconfortable, volontairement.' },
      { title: 'Seuil Atteint', desc: "La respiration s'est faite entendre au quatrième kilomètre." },
    ],
    'Tempo-Punny': [
      { title: 'Crise de Tempo', desc: "Les jambes ont protesté. La montre s'en fichait." },
      { title: 'Allure en Dents de Scie', desc: "Départ rapide, milieu honnête, tenu bon jusqu'au bout." },
    ],
    'Tempo-Poetic': [
      { title: "Là où Vit l'Inconfort", desc: 'Trouvé la limite, couru le long.' },
      { title: 'Allure Tenue, à Peine', desc: 'La discipline se mesure en secondes par kilomètre.' },
    ],
    'Race-Deadpan': [
      { title: 'Jour de Course', desc: "Couru plus loin que ce que l'entraînement suggérait." },
      { title: 'Record, de Justesse', desc: "Une seconde sous l'ancien record. Je prends." },
    ],
    'Race-Punny': [
      { title: 'Record Perso, Chaos Perso', desc: "Ligne d'arrivée réussie. Tous les choix d'avant, remis en question." },
      { title: 'Objectif Sub Atteint', desc: 'Barrière franchie. Un peu de moi aussi, au passage.' },
    ],
    'Race-Poetic': [
      { title: 'Chaque Seconde a Compté', desc: 'Des mois de matins tranquilles, dépensés en dix-neuf minutes.' },
      { title: "Ligne d'Arrivée, Enfin", desc: "Franchie, en sentant chaque kilomètre qui l'a précédée." },
    ],
  },
};

const type = ref<ActivityType>('Easy');
const tone = ref<Tone>('Deadpan');
const variants = ref<Record<string, number>>({});
const copied = ref(false);

const comboKey = computed(() => `${type.value}-${tone.value}`);
const result = computed(() => {
  const list = NAMES[fr.value ? 'fr' : 'en']![comboKey.value]!;
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
  <div class="mono-label section-label">{{ fr ? "TYPE D'ACTIVITÉ" : 'ACTIVITY' }}</div>
  <div class="chip-row">
    <button
      v-for="t in TYPES"
      :key="t"
      class="chip"
      :class="{ active: type === t }"
      @click="type = t"
    >
      {{ TYPE_LABEL[fr ? 'fr' : 'en']![t] }}
    </button>
  </div>

  <div class="mono-label section-label">{{ fr ? 'TON' : 'TONE' }}</div>
  <div class="chip-row">
    <button
      v-for="t in TONES"
      :key="t"
      class="chip tone-chip"
      :class="{ active: tone === t }"
      @click="tone = t"
    >
      {{ TONE_LABEL[fr ? 'fr' : 'en']![t] }}
    </button>
  </div>

  <div class="demo-pill">
    <span class="demo-label">{{ fr ? 'ACTIVITÉ DÉMO' : 'DEMO ACTIVITY' }}</span>
    <span class="demo-stats">{{ TYPE_STATS[type] }}</span>
  </div>

  <div class="result-card">
    <div class="result-head">
      <span class="result-tag">{{ TYPE_LABEL[fr ? 'fr' : 'en']![type] }} · {{ TONE_LABEL[fr ? 'fr' : 'en']![tone] }}</span>
      <div class="actions">
        <button class="icon-btn" :title="fr ? 'Copier' : 'Copy'" @click="copy">{{ copied ? '✓' : '⧉' }}</button>
        <button class="icon-btn spin" :title="fr ? 'Un autre' : 'Shuffle'" @click="shuffle">⟳</button>
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
