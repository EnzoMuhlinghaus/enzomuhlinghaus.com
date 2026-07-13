import { onMounted, ref, type Ref } from 'vue';

export type Lang = 'en' | 'fr';

const lang: Ref<Lang> = ref('en');

if (typeof window !== 'undefined') {
  window.addEventListener('langchange', (e) => {
    lang.value = (e as CustomEvent<Lang>).detail === 'fr' ? 'fr' : 'en';
  });
}

/**
 * Reactive current language, kept in sync with the site-wide toggle.
 * Islands are server-rendered in EN; syncing in onMounted keeps the first
 * client render identical to the SSR HTML so hydration stays clean.
 */
export function useLang(): Ref<Lang> {
  onMounted(() => {
    lang.value = document.documentElement.dataset.lang === 'fr' ? 'fr' : 'en';
  });
  return lang;
}
