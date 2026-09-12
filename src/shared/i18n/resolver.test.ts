import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { interpolate, pluralCategory, resolveBundleKey, type I18nBundle } from './resolver';

const bundle: I18nBundle = {
  pages: {
    history: {
      title: 'History',
      deleteSelected: 'Delete selected ({{count}})',
    },
    about: {
      developedBy: 'Developed by {{name}} <i>({{email}})</i>',
    },
    findInPage: {
      matches_one: '{{active}} of {{count}} match',
      matches_other: '{{active}} of {{count}} matches',
    },
    tabContainers: {
      collapsedTabs_one: '({{count}} tab collapsed)',
      collapsedTabs_other: '({{count}} tabs collapsed)',
    },
  },
};

// The real English bundle, as read by initI18nForTests — proves the resolver
// handles the actual shipped JSON (nested objects + flattened plural keys).
const realPages = JSON.parse(
  readFileSync(fileURLToPath(new URL('./locales/en/pages.json', import.meta.url)), 'utf8'),
) as Record<string, unknown>;
const realBundle: I18nBundle = { pages: realPages };

describe('interpolate', () => {
  test('replaces {{param}} (with and without spaces)', () => {
    expect(interpolate('Hello {{name}}!', { name: 'World' })).toBe('Hello World!');
    expect(interpolate('Hello {{ name }}!', { name: 'World' })).toBe('Hello World!');
  });

  test('keeps the placeholder when the param is missing', () => {
    expect(interpolate('Hello {{name}}!', {})).toBe('Hello {{name}}!');
    expect(interpolate('Hello {{name}}!')).toBe('Hello {{name}}!');
  });

  test('does not escape params (escapeValue: false parity)', () => {
    expect(interpolate('A <i>{{url}}</i>', { url: 'https://x.dev' })).toBe(
      'A <i>https://x.dev</i>',
    );
  });
});

describe('pluralCategory', () => {
  test('is one|other for counts in en/es/ca', () => {
    for (const locale of ['en', 'es', 'ca']) {
      expect(pluralCategory(locale, 1)).toBe('one');
      expect(pluralCategory(locale, 0)).toBe('other');
      expect(pluralCategory(locale, 5)).toBe('other');
    }
  });

  test('defaults to "other" for non-numeric or missing counts', () => {
    expect(pluralCategory('en', undefined)).toBe('other');
    expect(pluralCategory('en', 'lots')).toBe('other');
    expect(pluralCategory('en', '1')).toBe('other');
  });

  test('does not throw on malformed locales', () => {
    expect(pluralCategory('not-a-real-locale!!!', 1)).toBe('other');
  });
});

describe('resolveBundleKey', () => {
  test('resolves a plain dotted key', () => {
    expect(resolveBundleKey(bundle, 'en', 'pages:history.title')).toBe('History');
  });

  test('interpolates params', () => {
    expect(resolveBundleKey(bundle, 'en', 'pages:history.deleteSelected', { count: 3 })).toBe(
      'Delete selected (3)',
    );
  });

  test('keeps HTML from the template unchanged', () => {
    expect(
      resolveBundleKey(bundle, 'en', 'pages:about.developedBy', {
        name: 'AwesomeB',
        email: 'dev@awesomeb.dev',
      }),
    ).toBe('Developed by AwesomeB <i>(dev@awesomeb.dev)</i>');
  });

  test('selects the one/other plural form from count', () => {
    expect(
      resolveBundleKey(bundle, 'en', 'pages:findInPage.matches', {
        active: 1,
        count: 1,
      }),
    ).toBe('1 of 1 match');
    expect(
      resolveBundleKey(bundle, 'en', 'pages:findInPage.matches', {
        active: 2,
        count: 5,
      }),
    ).toBe('2 of 5 matches');
  });

  test('falls back to the "other" form without a count param', () => {
    expect(resolveBundleKey(bundle, 'en', 'pages:tabContainers.collapsedTabs', {})).toBe(
      '({{count}} tabs collapsed)',
    );
  });

  test('returns undefined for keys outside the bundle namespaces', () => {
    expect(resolveBundleKey(bundle, 'en', 'menu:app.about')).toBeUndefined();
  });

  test('returns undefined for keys without a namespace prefix', () => {
    expect(resolveBundleKey(bundle, 'en', 'history.title')).toBeUndefined();
  });

  test('returns undefined for unknown keys', () => {
    expect(resolveBundleKey(bundle, 'en', 'pages:this.key.does.not.exist')).toBeUndefined();
    expect(resolveBundleKey(bundle, 'en', 'pages:history.title.nope')).toBeUndefined();
  });

  test('resolves the real English pages bundle', () => {
    expect(resolveBundleKey(realBundle, 'en', 'pages:history.title')).toBe('History');
    expect(
      resolveBundleKey(realBundle, 'en', 'pages:findInPage.matches', { active: 1, count: 1 }),
    ).toBe('1 of 1 match');
    expect(
      resolveBundleKey(realBundle, 'en', 'pages:tabContainers.collapsedTabs', { count: 7 }),
    ).toBe('(7 tabs collapsed)');
    expect(resolveBundleKey(realBundle, 'en', 'pages:history.deleteSelected', { count: 4 })).toBe(
      'Delete selected (4)',
    );
  });
});
