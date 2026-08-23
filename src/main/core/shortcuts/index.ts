import { getGenericISOShortcuts } from './maps';
import type { TShortcutMapId, IShortcutMap } from '~/types';

export function getShortcutMaps(): Record<TShortcutMapId, IShortcutMap> {
  const genericIso = getGenericISOShortcuts();

  return {
    [genericIso.id]: genericIso,
  };
}

export { getShortcut, getActiveMap } from './helpers';
export { setupShortcutsIPC } from './ipc';
