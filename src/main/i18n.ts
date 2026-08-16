import i18next, { type i18n as I18nInstance } from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { app } from 'electron';
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  NAMESPACES,
  detectSystemLocale,
  isLocale,
  type Locale,
  type Namespace,
} from '~/i18n';
import { config } from '@/core/config';
import log from 'electron-log';

const scopeLog = log.scope('I18n');

const NS_PREFIXES = new Set<string>(NAMESPACES);

function detectNs(key: string): Namespace | undefined {
  const first = key.split('.')[0];
  return NS_PREFIXES.has(first) ? (first as Namespace) : undefined;
}

let instance: I18nInstance | null = null;
let initialized = false;

export function getI18n(): I18nInstance {
  if (!instance) {
    throw new Error('i18n not initialized — call initI18n() first');
  }
  return instance;
}

export function getCurrentLocale(): Locale {
  if (!instance) return DEFAULT_LOCALE;
  return (instance.language as Locale) ?? DEFAULT_LOCALE;
}

export async function initI18n(): Promise<void> {
  if (initialized) return;
  initialized = true;

  instance = i18next.createInstance();

  const stored = config.get('locale');
  const initialLocale: Locale =
    stored && isLocale(stored) ? stored : detectSystemLocale(app.getLocale());

  if (!stored || !isLocale(stored)) {
    config.save({ ...config.config, locale: initialLocale });
  }

  await instance.use(Backend).init({
    lng: initialLocale,
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: ['en', 'es', 'ca'],
    ns: [...NAMESPACES],
    defaultNS: 'common',
    backend: {
      loadPath: path.join(app.getAppPath(), 'dist-electron/main/locales/{{lng}}/{{ns}}.json'),
    },
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  scopeLog.info(`i18n initialized with locale: ${initialLocale}`);
}

export async function setLocale(locale: Locale): Promise<void> {
  if (!instance) throw new Error('i18n not initialized');
  if (!isLocale(locale)) throw new Error(`Invalid locale: ${locale}`);

  await instance.changeLanguage(locale);
  config.save({ ...config.config, locale });
  scopeLog.info(`Locale changed to: ${locale}`);
}

export function t(key: string, ns?: Namespace, options?: Record<string, unknown>): string {
  if (!instance) return key;
  const resolvedNs = ns ?? detectNs(key) ?? 'common';
  const strippedKey =
    resolvedNs !== 'common' && key.startsWith(`${resolvedNs}.`)
      ? key.slice(resolvedNs.length + 1)
      : key;
  return instance.t(strippedKey, { ns: resolvedNs, ...options });
}
