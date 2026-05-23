import { Browser, config, notification, getTheme } from '@/core';
import {
  createHandler,
  internalPageChecker,
  viewChecker,
  windowChecker,
  conditionalChecker,
} from '@/utils';
import type { IConfig, IWinDesConTab } from '~/types';
import { dialog } from 'electron';

export function setupConfigIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'config:get',
    'handle',
    browser,
    [
      conditionalChecker.bind(
        null,
        (args) => typeof args.winId === 'number',
        [windowChecker, viewChecker.bind(null, ['window'])],
        [internalPageChecker.bind(null, 'settings')],
      ),
    ],
    async ({}) => {
      return config.config;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ config: IConfig }>(
    'config:save',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({ config: newConfig }) => {
      config.save(newConfig);

      for (const window of browser.windows) {
        const desktop = window.selectedDesktop;
        if (desktop) {
          const theme = getTheme(desktop.theme.name);
          desktop.updateTheme(theme);
        }
      }

      browser.toRenderer.refreshConfig();

      notification('Settings saved', 'Your settings have been saved successfully.');
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tabData: IWinDesConTab }>(
    'config:select-download-folder',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({ tabData }) => {
      const result = await dialog.showOpenDialog(tabData.window.bw, {
        defaultPath: config.getProperty('downloadsFolder'),
        properties: ['openDirectory', 'createDirectory'],
      });

      return result.canceled ? null : result.filePaths[0];
    },
  );
}
