import i18next from 'i18next';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './constants';
import { detectSystemLocale, initI18n, isLocale, t } from './i18n';

beforeAll(initI18n);
afterAll(() => i18next.changeLanguage(DEFAULT_LOCALE));

// First candidate not present in constants; stays correct as languages come and go
const unsupportedLanguage = ['fr', 'de', 'pt', 'it', 'ja'].find((l) => !isLocale(l))!;

describe('isLocale', () => {
  test('accepts every locale declared in constants', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(isLocale(locale), locale).toBe(true);
    }
  });

  test.each(['', ...SUPPORTED_LOCALES.map((l) => l.toUpperCase())])(
    'rejects "%s" (exact, case-sensitive match)',
    (candidate) => {
      expect(isLocale(candidate)).toBe(false);
    },
  );

  test.each(SUPPORTED_LOCALES.map((l) => `${l}-US`))(
    'rejects "%s" (no region fallback)',
    (candidate) => {
      expect(isLocale(candidate)).toBe(false);
    },
  );
});

describe('detectSystemLocale', () => {
  test('maps OS locale to its language part', () => {
    expect(detectSystemLocale('en-US')).toBe('en');
    for (const locale of SUPPORTED_LOCALES) {
      expect(detectSystemLocale(`${locale}-ZZ`)).toBe(locale);
    }
  });

  test('clamps unsupported languages to the default locale', () => {
    expect(detectSystemLocale(`${unsupportedLanguage}-FR`)).toBe('en');
  });

  test('handles empty input', () => {
    expect(detectSystemLocale('')).toBe('en');
  });
});

describe('t', () => {
  test('resolves translations per active locale', async () => {
    await i18next.changeLanguage('ca');
    expect(t('menu:tabs.close')).toBe('Tanca la pestanya');

    await i18next.changeLanguage('es');
    expect(t('menu:tabs.close')).toBe('Cerrar pestaña');
  });

  test('interpolates parameters', async () => {
    await i18next.changeLanguage('es');
    expect(t('menu:app.about', { appName: 'Foo' })).toBe('Acerca de Foo');
    expect(t('menu:tabs.entry', { index: 3 })).toBe('Pestaña 3');

    await i18next.changeLanguage('en');
    expect(t('menu:app.about', { appName: 'Foo' })).toBe('About Foo');
  });

  test('returns the key itself for unknown keys', () => {
    // i18next strips the namespace prefix when a key cannot be resolved
    expect(t('menu:this.key.does.not.exist')).toBe('this.key.does.not.exist');
    // Plain strings (no dots, no namespace) pass through untouched
    expect(t('Go back')).toBe('Go back');
  });

  test('falls back for empty namespaces without crashing', () => {
    // common.json is intentionally empty; t() must degrade gracefully
    expect(t('common:anything')).toBe('anything');
  });
});
