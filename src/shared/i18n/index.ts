import type { Locale, Namespace } from './config';
export { LOCALES, DEFAULT_LOCALE, FALLBACK_LOCALE, NAMESPACES, FALLBACK_CHAIN } from './config';
export type { Locale, Namespace };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (['en', 'es', 'ca'] as const).includes(value as Locale);
}

export function detectSystemLocale(rawLocale: string): Locale {
  const lower = rawLocale.toLowerCase();
  if (lower.startsWith('ca')) return 'ca';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';
  return 'en';
}
