<script setup lang="ts">
// The "?" help bubble used across the bench. Design System v2 §08.
//
// This is a button rather than the `<span tabindex="0" role="note">` it used to
// be, because the tip was previously revealed only by `:hover` / `:focus-visible`
// — and touch has no hover, while `:focus-visible` does not match a tapped
// non-form element on iOS Safari or Chrome Android. The help text was therefore
// unreachable on a phone. A real button toggles on click, which works on every
// pointer type, and keeps the keyboard and screen-reader paths intact.
import { ref, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';

withDefaults(
  defineProps<{
    text: string;
    /** `lg` is the card-corner bubble, `sm` the inline one beside a label. */
    size?: 'lg' | 'sm';
    /** Hang the tip off the right edge, for bubbles near a card's right side. */
    right?: boolean;
  }>(),
  { size: 'lg', right: false },
);

const open = ref(false);
const root = useTemplateRef<HTMLElement>('root');

/** Dismiss on an outside press or Escape — a tip left open would cover the card. */
function onPointerDown(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false;
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    open.value = false;
    root.value?.focus();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown);
  document.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <button
    ref="root"
    type="button"
    :class="size === 'sm' ? 'iinfo' : 'info'"
    :aria-expanded="open"
    :aria-label="text"
    @click="open = !open"
  >
    ?
    <span class="tip" :class="{ 'tip--right': right }">{{ text }}</span>
  </button>
</template>
