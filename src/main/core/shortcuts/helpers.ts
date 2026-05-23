import type { IShortcut, IShortcutMap } from '~/types';
import { config } from '@/core';
import { SHORTCUTS_MAPS } from './index';

export function getShortcut(id: string): IShortcut {
  const map = getDefaultMap();
  const shortcut = map.shortcuts[id];
  if (!shortcut) {
    throw new Error(`Shortcut with id "${id}" not found in map "${map.id}".`);
  }
  return shortcut;
}

function getDefaultMap(): IShortcutMap {
  const id = config.get('shortcutMap') || 'generic-iso';
  const map = SHORTCUTS_MAPS[id];
  if (!map) {
    throw new Error(`Shortcut map with id "${id}" not found.`);
  }
  return map;
}
