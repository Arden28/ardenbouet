// lib/i18n/content.ts — translatable site content (projects, experience, products, journey).
// Items keep their English fields; French overrides live in `translations.fr` and are merged
// at render time. Anything not translated falls back to English. Pure module.
import type { Locale } from './config';

export type Translatable<T> = T & { translations?: Partial<Record<Exclude<Locale, 'en'>, Partial<T>>> };

export function localize<T extends { translations?: { fr?: object } }>(item: T, locale: Locale): T {
  if (locale === 'en' || !item.translations?.[locale]) return item;
  const override = item.translations[locale] as Record<string, unknown>;
  const out = { ...item } as Record<string, unknown>;
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && !v.trim()) continue;
    if (Array.isArray(v) && !v.length) continue;
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object') {
      out[k] = { ...(out[k] as object), ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== '' && x !== undefined && !(Array.isArray(x) && !x.length))) };
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

/**
 * Orders items for a locale: items in that language (or "both"/unset) first, then the rest.
 * Nothing is hidden — untranslated items fall back to their original language, so the French
 * site is never emptier than the English one.
 */
export function forLocale<T extends { language?: string }>(items: T[], locale: Locale): T[] {
  const mine = (i: T) => !i.language || i.language === 'both' || i.language === locale;
  return [...items.filter(mine), ...items.filter(i => !mine(i))];
}
