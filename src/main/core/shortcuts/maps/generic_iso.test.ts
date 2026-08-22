import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { SHORTCUTS_MAP } from './generic_iso';

type Json = Record<string, unknown>;

const MAP_DIR = fileURLToPath(new URL('.', import.meta.url));

// Shortcuts whose labels are intentionally plain text (they never appear in
// the main menu; selectDesktop1..9 only surface in Settings > Shortcuts).
const UNTRANSLATED = new Set([
  'selectDesktop1',
  'selectDesktop2',
  'selectDesktop3',
  'selectDesktop4',
  'selectDesktop5',
  'selectDesktop6',
  'selectDesktop7',
  'selectDesktop8',
  'selectDesktop9',
]);

function loadMenuJson(lng: string): Json {
  const file = path.resolve(MAP_DIR, '../../../../shared/i18n/locales', lng, 'menu.json');
  return JSON.parse(readFileSync(file, 'utf8')) as Json;
}

function hasTranslation(json: Json, key: string): boolean {
  let node: unknown = json;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return false;
    node = (node as Json)[part];
  }
  return typeof node === 'string';
}

describe('SHORTCUTS_MAP labels', () => {
  const entries = Object.entries(SHORTCUTS_MAP.shortcuts);

  test('every shortcut id is unique and non-empty', () => {
    const ids = entries.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every non-whitelisted label is an i18n key present in all locales', () => {
    const menus = Object.fromEntries(['en', 'es', 'ca'].map((lng) => [lng, loadMenuJson(lng)]));
    const problems: string[] = [];
    for (const [id, shortcut] of entries) {
      if (UNTRANSLATED.has(id)) continue;
      if (!shortcut.label.startsWith('menu:')) {
        problems.push(`${id}: label "${shortcut.label}" is not an i18n key`);
        continue;
      }
      const key = shortcut.label.slice('menu:'.length);
      for (const [lng, menu] of Object.entries(menus)) {
        if (!hasTranslation(menu as Json, key)) {
          problems.push(`${id}: key "${shortcut.label}" missing in ${lng}/menu.json`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test('whitelisted ids exist and are exactly the untranslated set', () => {
    const plainLabels = entries.filter(([, sc]) => !sc.label.startsWith('menu:')).map(([id]) => id);
    expect([...plainLabels].sort()).toEqual([...UNTRANSLATED].sort());
  });
});
