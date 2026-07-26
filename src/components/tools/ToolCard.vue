<script setup lang="ts">
// One paper tool card on the bench. Every card shares this anatomy:
// No. + "?" help bubble, felt-tip name, one-line subtitle, then the controls.
// Design System v2 §08.
defineProps<{
  no: string;
  title: string;
  subtitle: string;
  help: string;
  /** Cards alternate the two page creams across the grid. */
  tone: 'l' | 'r';
}>();
</script>

<template>
  <section class="card" :data-tone="tone">
    <div class="card-head">
      <span class="card-no">No. {{ no }}</span>
      <span class="info" tabindex="0" role="note" :aria-label="help">?<span class="tip tip--right">{{ help }}</span></span>
    </div>
    <h2 class="card-title">{{ title }}</h2>
    <p class="card-sub">{{ subtitle }}</p>
    <slot />
  </section>
</template>

<style scoped>
.card {
  position: relative;
  background: var(--paper-l);
  border: 1.5px solid var(--ink);
  border-radius: 12px;
  padding: 24px 26px 26px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.3);
}

.card[data-tone='r'] {
  background: var(--paper-r);
}

.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.card-no {
  font-family: var(--font-label);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--gold);
}

.card-title {
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 36px;
  line-height: 1;
  color: var(--ink);
  margin: 0 0 2px;
}

.card-sub {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 18px;
  color: var(--on-desk-3);
  margin: 0 0 16px;
}
</style>
