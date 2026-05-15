import { SHORTCUTS_MAP_GENERIC_ISO } from './maps';
import type { TShortcutMapId, IShortcutMap } from '~/types';

export const SHORTCUTS_MAPS: Record<TShortcutMapId, IShortcutMap> = {
  [SHORTCUTS_MAP_GENERIC_ISO.id]: SHORTCUTS_MAP_GENERIC_ISO,
};

export { getShortcut } from './helpers';
export { setupShortcutsIPC } from './ipc';
