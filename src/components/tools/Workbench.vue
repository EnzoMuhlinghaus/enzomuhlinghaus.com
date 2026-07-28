<script setup lang="ts">
// The whole toolbox: one masthead unit toggle driving a 2×2 grid of tool cards.
// A single island rather than four, so the KM/MI setting is genuinely shared
// (Design System v2 §08).
import { ref } from 'vue';
import { useUnit, type Unit } from '../../lib/units';
import { SITE_ORIGIN } from '../../data/site';
import { useMessages } from '../../i18n';
import PaceCalculator from './PaceCalculator.vue';
import RacePredictor from './RacePredictor.vue';
import MasEstimator from './MasEstimator.vue';
// StravaNamer.vue is finished code but deliberately not mounted — the tool
// isn't ready to ship, so it stays off the bench and off the journal's
// workbench card in src/pages/index.astro. Re-add both together.

const m = useMessages();
const unit = useUnit();
const pace = ref<InstanceType<typeof PaceCalculator> | null>(null);

function setUnit(u: Unit) {
  if (unit.value === u) return;
  // Only the pace card holds user-entered distances/paces in the active unit;
  // every other card derives its output, so flipping the ref is enough there.
  pace.value?.convertTo(u);
  unit.value = u;
}
</script>

<template>
  <div class="bench">
    <header class="masthead">
      <div>
        <div class="masthead-eyebrow">{{ m.toolbox.eyebrow }}</div>
        <h1 class="masthead-title">{{ m.toolbox.title }}</h1>
        <p class="masthead-sub">{{ m.toolbox.blurb }}</p>
      </div>
      <div class="units">
        <div class="units-label">{{ m.toolbox.unitsLabel }}</div>
        <div class="units-row">
          <button
            v-for="u in (['km', 'mi'] as Unit[])"
            :key="u"
            class="pill pill--unit"
            :class="{ active: unit === u }"
            :aria-pressed="unit === u"
            @click="setUnit(u)"
          >
            {{ u.toUpperCase() }}
          </button>
        </div>
      </div>
    </header>

    <div class="grid">
      <PaceCalculator ref="pace" />
      <RacePredictor />
      <MasEstimator />
    </div>

    <footer class="bench-foot">
      <p class="foot-line">
        {{ m.toolbox.builtBy }}
        <!-- Absolute: the bench is served from its own hostname, so "/" here
             would loop back to the bench rather than reach the journal. -->
        <a :href="SITE_ORIGIN">{{ m.toolbox.readJournal }} <span class="arrow-ne">→</span></a>
      </p>
      <p class="foot-note">{{ m.toolbox.disclaimer }}</p>
    </footer>
  </div>
</template>

<style scoped>
.bench {
  max-width: 1120px;
  margin: 0 auto;
}

.masthead {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  border-bottom: 1.5px solid rgba(200, 184, 143, 0.28);
  padding-bottom: 18px;
  margin-bottom: 26px;
}

.masthead-eyebrow {
  font-family: var(--font-label);
  font-size: 12px;
  letter-spacing: 0.3em;
  color: var(--gold);
  margin-bottom: 8px;
}

.masthead-title {
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 52px;
  line-height: 0.9;
  color: var(--on-desk);
  margin: 0;
}

.masthead-sub {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 20px;
  color: var(--on-desk-2);
  margin: 8px 0 0;
}

.units {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.units-label {
  font-family: var(--font-label);
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--on-desk-3);
}

.units-row {
  display: flex;
  gap: 6px;
}

/* On the dark bench the outline pills need the light ink, not the paper ink. */
.units-row .pill {
  font-size: 11px;
  padding: 8px 18px;
  color: var(--on-desk-2);
  border-color: rgba(200, 184, 143, 0.4);
}

.units-row .pill.active {
  color: var(--paper-l);
}

/* Cards stretch to their row's height, so paired cards square off. */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}

.bench-foot {
  text-align: center;
  margin: 34px auto 0;
  max-width: 640px;
}

.foot-line {
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 22px;
  color: var(--on-desk-2);
  margin: 0;
}

.foot-line a {
  color: #e8b04a;
  border-bottom: 2px solid rgba(232, 176, 74, 0.5);
  display: inline-block;
  transition: transform 0.2s ease;
}

.foot-line a:hover {
  transform: translateX(4px);
}

.foot-note {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--on-desk-3);
  line-height: 1.6;
  margin: 12px 0 0;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .masthead-title {
    font-size: 42px;
  }
}
</style>
