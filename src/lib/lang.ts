// Currently unused: `useMessages()` returns the English dictionary outright
// while French is dormant. Kept as the seam to restore it through.
import { ref, type Ref } from 'vue';

export type Lang = 'en' | 'fr';

const lang: Ref<Lang> = ref('en');

/**
 * The current language — pinned to English.
 *
 * French is dormant until the translation has been reviewed, so this no longer
 * reads `data-lang` and no longer listens for `langchange`: the only way an
 * island could have rendered FR was a client-side flip after hydration, and
 * that is exactly what must not happen. The `Lang` union and the ref stay so
 * the call sites survive; restore the reads alongside real /fr/ routes.
 */
export function useLang(): Ref<Lang> {
  return lang;
}
