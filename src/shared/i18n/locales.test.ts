import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { DEFAULT_LOCALE, NAMESPACES, SUPPORTED_LOCALES } from './constants';

type Json = Record<string, unknown>;

// Raw file contents — this suite validates the JSON resources themselves,
// no i18next involved.
const resources = (() => {
  const localesDir = fileURLToPath(new URL('./locales', import.meta.url));
  const out: Record<string, Record<string, Json>> = {};
  for (const lng of SUPPORTED_LOCALES) {
    out[lng] = {};
    for (const ns of NAMESPACES) {
      const file = path.join(localesDir, lng, `${ns}.json`);
      out[lng][ns] = JSON.parse(readFileSync(file, 'utf8')) as Json;
    }
  }
  return out;
})();

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix];
  return Object.entries(value as Json).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leafStrings(value: unknown, prefix = ''): Array<{ key: string; value: string }> {
  if (typeof value === 'string') return [{ key: prefix, value }];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Json).flatMap(([key, child]) =>
    leafStrings(child, prefix ? `${prefix}.${key}` : key),
  );
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort();
}

describe('locale resources', () => {
  test('every locale x namespace is a valid JSON object', () => {
    for (const lng of SUPPORTED_LOCALES) {
      for (const ns of NAMESPACES) {
        expect(resources[lng]?.[ns], `${lng}/${ns}.json`).toBeTypeOf('object');
      }
    }
  });

  test.each(NAMESPACES)('namespace "%s" has identical keys across locales', (ns) => {
    const base = flattenKeys(resources[DEFAULT_LOCALE][ns]).sort();
    // common.json is an intentional placeholder and may be empty; menu must not be
    if (ns === 'menu') {
      expect(base.length, `${DEFAULT_LOCALE}/${ns} must not be empty`).toBeGreaterThan(0);
    }
    for (const lng of SUPPORTED_LOCALES) {
      if (lng === DEFAULT_LOCALE) continue;
      expect(flattenKeys(resources[lng][ns]).sort(), `${lng}/${ns} key mismatch`).toEqual(base);
    }
  });

  test.each(NAMESPACES)('namespace "%s" has consistent placeholders across locales', (ns) => {
    for (const lng of SUPPORTED_LOCALES) {
      if (lng === DEFAULT_LOCALE) continue;
      for (const { key, value } of leafStrings(resources[lng][ns])) {
        const base = leafStrings(resources[DEFAULT_LOCALE][ns]).find((l) => l.key === key);
        if (!base || placeholders(base.value).length === 0) continue;
        expect(placeholders(value), `${lng}/${ns}:${key}`).toEqual(placeholders(base.value));
      }
    }
  });

  test('menu namespace has no empty translations', () => {
    for (const lng of SUPPORTED_LOCALES) {
      for (const { key, value } of leafStrings(resources[lng].menu)) {
        expect(value.trim(), `${lng}/menu:${key}`).not.toBe('');
      }
    }
  });
});
