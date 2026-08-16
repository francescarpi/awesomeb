export const LOCALES = ['en', 'es', 'ca'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const FALLBACK_LOCALE: Locale = 'en';

export const NAMESPACES = [
  'common',
  'menu',
  'commands',
  'shortcuts',
  'prompts',
  'pages',
  'errors',
] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const FALLBACK_CHAIN: Record<Locale, Locale[]> = {
  en: ['en'],
  es: ['es', 'en'],
  ca: ['ca', 'es', 'en'],
};
