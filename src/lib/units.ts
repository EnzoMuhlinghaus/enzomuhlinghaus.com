import { ref, type Ref } from 'vue';

export type Unit = 'km' | 'mi';

/**
 * The workbench's single KM/MI setting. v2 puts one toggle in the masthead that
 * drives every tool card at once, so this is a module-level ref shared by all of
 * them rather than per-component state (Design System v2 §08, "MASTHEAD").
 */
const unit: Ref<Unit> = ref('km');

export function useUnit(): Ref<Unit> {
  return unit;
}
