import { Browser, config, notification } from '@/core';
import { createHandler, internalPageChecker } from '@/utils';
import { SHORTCUTS_MAPS } from './index';
import type { TShortcutMapId, TShortcutId } from '~/types';

export function setupShortcutsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'shortcuts:maps',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({}) => {
      return SHORTCUTS_MAPS;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ mapId: TShortcutMapId; shortcutId: TShortcutId; key: string }>(
    'shortcuts:override',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({ mapId: id, shortcutId, key }) => {
      const map = SHORTCUTS_MAPS[id];
      if (!map) throw new Error(`Shortcut map "${id}" not found`);
      if (!map.shortcuts[shortcutId])
        throw new Error(`Shortcut "${shortcutId}" not found in map "${id}"`);

      map.shortcuts[shortcutId].key = key;

      const currentConfig = config.config;
      currentConfig.shortcutsOverrides = currentConfig.shortcutsOverrides ?? {};
      currentConfig.shortcutsOverrides[shortcutId] = key;
      config.save(currentConfig);

      await browser.refreshMainMenu();

      notification(`Shortcut "${map.shortcuts[shortcutId].label}" updated`, `New key: ${key}`);
    },
  );
}
