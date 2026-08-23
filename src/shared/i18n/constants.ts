export const LOCALES = new Map([
  ['en', 'English'],
  ['es', 'Español'],
  ['ca', 'Català'],
]);

export const DEFAULT_LOCALE = 'en';

export const FALLBACK_LOCALE = 'en';

export const SUPPORTED_LOCALES = Array.from(LOCALES.keys());

export const NAMESPACES = ['common', 'menu', 'commands'];

export const DEFAULT_NAMESPACE = 'common';
