import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { getActiveMap, getShortcut } from './helpers';
import { config } from '@/core';
import { getShortcutMaps } from './index';

describe('getActiveMap', () => {
  let originalOverrides: Record<string, string> | undefined;

  beforeEach(() => {
    originalOverrides = { ...(config.config.shortcutsOverrides ?? {}) };
    config.save({ ...config.config, shortcutsOverrides: {} });
  });

  afterEach(() => {
    config.save({ ...config.config, shortcutsOverrides: originalOverrides ?? {} });
  });

  test('returns the default map when there are no overrides', () => {
    const map = getActiveMap();
    expect(map.id).toBe('generic-iso');
    expect(map.shortcuts.performCommand.key).toBe('CmdOrCtrl+P');
    expect(map.shortcuts.newTab.key).toBe('CmdOrCtrl+T');
  });

  test('applies overrides on top of the default map', () => {
    config.save({
      ...config.config,
      shortcutsOverrides: {
        performCommand: 'CmdOrCtrl+K',
      },
    });

    const map = getActiveMap();
    expect(map.shortcuts.performCommand.key).toBe('CmdOrCtrl+K');
    expect(map.shortcuts.newTab.key).toBe('CmdOrCtrl+T');
  });

  test('returns a clone that does not leak back to getShortcutMaps()', () => {
    const map = getActiveMap();
    map.shortcuts.performCommand.key = 'CmdOrCtrl+Z';

    expect(getShortcutMaps()['generic-iso'].shortcuts.performCommand.key).toBe('CmdOrCtrl+P');
    expect(getShortcut('performCommand').key).toBe('CmdOrCtrl+P');
  });

  test('ignores override ids that do not exist in the map', () => {
    config.save({
      ...config.config,
      shortcutsOverrides: {
        nonExistentShortcut: 'CmdOrCtrl+Q',
        performCommand: 'CmdOrCtrl+K',
      },
    });

    const map = getActiveMap();
    expect(map.shortcuts.performCommand.key).toBe('CmdOrCtrl+K');
    expect(map.shortcuts.nonExistentShortcut).toBeUndefined();
  });
});
