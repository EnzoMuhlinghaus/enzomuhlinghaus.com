import { computed, type ComputedRef } from 'vue';
import { en, type Messages } from './en';
import { fr } from './fr';
import { useLang } from '../lib/lang';

export { en, fr };
export type { Messages };

/**
 * The language the server renders. v2 has no toggle and `<html lang>` is
 * hard-coded in Layout.astro, so this is the single place that decides which
 * half of every `{ en, fr }` pair reaches the HTML (see `<T>`). Restoring French
 * means routing on it, not flipping it globally.
 */
export const SITE_LANG: 'en' | 'fr' = 'en';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Pairable = string | ((...args: any[]) => any) | readonly unknown[];

type DeepPair<T> = {
  [K in keyof T]: T[K] extends Pairable ? { en: T[K]; fr: T[K] } : DeepPair<T[K]>;
};

function zip(a: any, b: any): any {
  if (typeof a === 'object' && a !== null && !Array.isArray(a)) {
    const out: any = {};
    for (const k of Object.keys(a)) out[k] = zip(a[k], b[k]);
    return out;
  }
  return { en: a, fr: b };
}

/**
 * Both languages side by side: every leaf is `{ en, fr }`. Astro templates pick
 * one with `[SITE_LANG]`, usually via the <T> component; leaves that take
 * arguments are called directly at the call site.
 */
export const t: DeepPair<Messages> = zip(en, fr);

/** Vue composable: the current language's dictionary, reactive to the toggle. */
export function useMessages(): ComputedRef<Messages> {
  const lang = useLang();
  return computed(() => (lang.value === 'fr' ? fr : en));
}
