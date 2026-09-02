import { getGenericISOShortcuts, getGenericANSIShortcuts } from './maps';
import type { TShortcutMapId, IShortcutMap } from '~/types';

export function getShortcutMaps(): Record<TShortcutMapId, IShortcutMap> {
  const genericIso = getGenericISOShortcuts();
  const genericAnsi = getGenericANSIShortcuts();

  return {
    [genericAnsi.id]: genericAnsi,
    [genericIso.id]: genericIso,
  };
}

export { getShortcut, getActiveMap } from './helpers';
export { setupShortcutsIPC } from './ipc';
