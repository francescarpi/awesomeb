import { Browser, config, notification, getTheme } from '@/core';
import { t } from '~/i18n';
import {
  createHandler,
  internalPageChecker,
  viewChecker,
  windowChecker,
  conditionalChecker,
} from '@/utils';
import type { IConfig, IWinDesConTab, IConfigInfo } from '~/types';
import { dialog, app, shell } from 'electron';
import { userDataPath, getRepoUrl } from '@/paths';

export function setupConfigIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'config:get',
    'handle',
    browser,
    [
      conditionalChecker.bind(
        null,
        (args) => typeof args.winId === 'number' && (args.winId as number) !== -1,
        [windowChecker, viewChecker.bind(null, ['window'])],
        [internalPageChecker.bind(null, 'settings'), internalPageChecker.bind(null, 'bookmarks')],
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

      notification(t('notifications:settingsSaved.title'), t('notifications:settingsSaved.body'));
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

  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'config:get-config-folder',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({}) => {
      const data: IConfigInfo = {
        version: app.getVersion(),
        configPath: userDataPath(),
        chromeVersion: process.versions.chrome,
        repoUrl: getRepoUrl(),
      };
      return data;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'config:open-config-folder',
    'on',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({}) => {
      shell.showItemInFolder(userDataPath());
    },
  );
}
