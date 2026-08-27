import { Browser, config, notification, type Window } from '@/core';
import { t } from '~/i18n';
import { createHandler, internalPageChecker, viewChecker, windowChecker } from '@/utils';
import { getShortcutMaps } from './index';
import { getActiveMap } from './helpers';
import type { TShortcutMapId, TShortcutId } from '~/types';

export function setupShortcutsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'shortcuts:maps',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({}) => {
      return getShortcutMaps();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ mapId: TShortcutMapId; shortcutId: TShortcutId; key: string }>(
    'shortcuts:override',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({ mapId: id, shortcutId, key }) => {
      const map = getShortcutMaps()[id];
      if (!map) throw new Error(`Shortcut map "${id}" not found`);
      if (!map.shortcuts[shortcutId])
        throw new Error(`Shortcut "${shortcutId}" not found in map "${id}"`);

      map.shortcuts[shortcutId].key = key;

      const currentConfig = config.config;
      currentConfig.shortcutsOverrides = currentConfig.shortcutsOverrides ?? {};
      currentConfig.shortcutsOverrides[shortcutId] = key;
      config.save(currentConfig);

      await browser.refreshMainMenu();
      browser.toRenderer.broadcast('shortcuts:changed', { shortcutId, key });

      notification(
        t('notifications:shortcutUpdated.title', { label: map.shortcuts[shortcutId].label }),
        t('notifications:shortcutUpdated.body', { key }),
      );
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'shortcuts:active',
    'handle',
    browser,
    [
      [
        windowChecker,
        viewChecker.bind(null, ['window']),
        internalPageChecker.bind(null, 'settings'),
      ],
    ],
    async ({}) => {
      return getActiveMap();
    },
  );
}
