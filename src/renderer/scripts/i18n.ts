import i18next, { type i18n as I18nInstance } from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { NAMESPACES, FALLBACK_LOCALE, type Locale, type Namespace } from '~/i18n';

const NS_PREFIXES = new Set<string>(NAMESPACES);

function detectNs(key: string): Namespace | undefined {
  const first = key.split('.')[0];
  return NS_PREFIXES.has(first) ? (first as Namespace) : undefined;
}

let instance: I18nInstance | null = null;

export async function initI18n(): Promise<I18nInstance> {
  if (instance) return instance;
  instance = i18next.createInstance();

  const locale = await abI18n.getLocale();

  await instance.use(HttpBackend).init({
    lng: locale,
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: ['en', 'es', 'ca'],
    ns: [...NAMESPACES],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  await instance.loadNamespaces([...NAMESPACES]);

  abI18n.onLocaleChanged((_event, newLocale) => {
    if (instance) {
      instance.changeLanguage(newLocale).catch((err) => {
        console.error('Failed to change language:', err);
      });
    }
  });

  return instance;
}

export function t(key: string, options?: Record<string, unknown>): string {
  if (!instance) return key;
  const detectedNs = detectNs(key);
  if (detectedNs) {
    const strippedKey = key.startsWith(`${detectedNs}.`) ? key.slice(detectedNs.length + 1) : key;
    return instance.t(strippedKey, { ns: detectedNs, ...options });
  }
  return instance.t(key, options);
}

export function getLocale(): Locale {
  if (!instance) return 'en';
  return (instance.language as Locale) ?? 'en';
}

export function onLocaleChange(callback: (locale: Locale) => void): () => void {
  if (!instance) return () => {};
  const handler = (lng: string) => callback(lng as Locale);
  instance.on('languageChanged', handler);
  return () => {
    if (instance) instance.off('languageChanged', handler);
  };
}

export type { Locale, Namespace };
