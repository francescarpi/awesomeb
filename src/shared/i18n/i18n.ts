import i18next from 'i18next';
import type { Resource, InitOptions } from 'i18next';
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  SUPPORTED_LOCALES,
  NAMESPACES,
  DEFAULT_NAMESPACE,
} from './constants';
import { app } from 'electron';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '@/core';
import type { Locale } from './types';

/** vitest.setup.ts exports TEST=true before any import; the real app never does. */
function isTestEnv(): boolean {
  return process.env.TEST === 'true';
}

/**
 * Options shared by every environment. Each init below spreads this and adds
 * only what differs (lng, resources/backend), so behavior cannot drift.
 */
function baseInitOptions(): InitOptions {
  return {
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    ns: [...NAMESPACES],
    defaultNS: DEFAULT_NAMESPACE,
    interpolation: { escapeValue: false },
    returnNull: false,
  };
}

/**
 * Test-only bootstrap. The fs-backend resolves against dist-electron/locales,
 * which does not exist under vitest (electron paths are mocked), so tests load
 * the real locale JSON files in-memory instead. Every other option mirrors the
 * production init below, keeping tested behavior identical.
 */
async function initI18nForTests(): Promise<void> {
  const localesDir = fileURLToPath(new URL('./locales', import.meta.url));
  const resources: Record<string, Record<string, unknown>> = {};
  for (const lng of SUPPORTED_LOCALES) {
    resources[lng] = {};
    for (const ns of NAMESPACES) {
      const file = path.join(localesDir, lng, `${ns}.json`);
      resources[lng][ns] = JSON.parse(readFileSync(file, 'utf8'));
    }
  }

  // Trusted project fixtures: bridges JSON.parse's unknown leaves to
  // i18next's stricter ResourceKey shape.
  await i18next.init({
    ...baseInitOptions(),
    lng: DEFAULT_LOCALE,
    resources: resources as Resource,
  });
}

const DEBUG = false;

export async function initI18n(): Promise<void> {
  if (isTestEnv()) {
    await initI18nForTests();
    return;
  }

  const configLocale = config.get('locale');
  const initialLocale: Locale =
    configLocale && isLocale(configLocale) ? configLocale : detectSystemLocale(app.getLocale());

  if (!configLocale || !isLocale(configLocale)) {
    config.save({ ...config.config, locale: initialLocale });
  }

  await i18next.use(Backend).init({
    ...baseInitOptions(),
    lng: initialLocale,
    debug: DEBUG,
    backend: {
      loadPath: path.join(app.getAppPath(), 'dist-electron/locales/{{lng}}/{{ns}}.json'),
    },
  });
}

export function t(key: string, params?: Record<string, unknown>): string {
  return i18next.t(key, { ...params });
}

export function isLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale);
}

export function detectSystemLocale(rawLocale: string): Locale {
  const appLocale = rawLocale.split('-')[0];
  return appLocale !== undefined && isLocale(appLocale) ? appLocale : DEFAULT_LOCALE;
}
