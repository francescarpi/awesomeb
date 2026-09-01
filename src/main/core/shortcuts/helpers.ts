import type { IShortcut, IShortcutMap } from '~/types';
import { config } from '@/core';
import { getShortcutMaps } from './index';
import { DEFAULT_SHORTCUTS_MAP } from '~/constants';

export function getShortcut(id: string): IShortcut {
  const map = getDefaultMap();
  const shortcut = map.shortcuts[id];
  if (!shortcut) {
    throw new Error(`Shortcut with id "${id}" not found in map "${map.id}".`);
  }
  return shortcut;
}

export function getDefaultMap(): IShortcutMap {
  const id = config.get('shortcutMap') || DEFAULT_SHORTCUTS_MAP;
  const map = getShortcutMaps()[id];
  if (!map) {
    throw new Error(`Shortcut map with id "${id}" not found.`);
  }
  return map;
}

export function getActiveMap(): IShortcutMap {
  const baseMap = getDefaultMap();
  const cloned: IShortcutMap = {
    id: baseMap.id,
    name: baseMap.name,
    shortcuts: Object.fromEntries(Object.entries(baseMap.shortcuts).map(([k, v]) => [k, { ...v }])),
  };

  const overrides = config.get('shortcutsOverrides') ?? {};
  for (const [id, key] of Object.entries(overrides)) {
    if (cloned.shortcuts[id]) {
      cloned.shortcuts[id] = { ...cloned.shortcuts[id], key };
    }
  }

  return cloned;
}
