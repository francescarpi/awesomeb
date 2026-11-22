import { Browser, Window, config, notification, getTheme } from '@/core';
import { t } from '~/i18n';
import {
  createHandler,
  internalPageChecker,
  viewChecker,
  windowChecker,
  modalChecker,
  multiConditional,
  welcomeWindowChecker,
  findInPageChecker,
  tabChecker,
} from '@/utils';
import type { IConfig, IWinDesConTab, IConfigInfo, TTabTagId } from '~/types';
import { dialog, app, shell } from 'electron';
import { userDataPath, getRepoUrl } from '@/paths';
import log from 'electron-log';

const scopeLog = log.scope('ConfigIPC');

export function setupConfigIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'config:get',
    'handle',
    browser,
    [
      multiConditional(
        [
          [
            (args) => typeof args.winId === 'number' && (args.winId as number) !== -1,
            [windowChecker, viewChecker.bind(null, ['window'])],
          ],
          [
            (args) => typeof args.tabId === 'number' && (args.tabId as number) !== -1,
            [tabChecker, findInPageChecker],
          ],
        ],
        [
          internalPageChecker.bind(null, ['settings']),
          internalPageChecker.bind(null, ['bookmarks']),
          internalPageChecker.bind(null, ['history']),
          welcomeWindowChecker,
        ],
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
    [internalPageChecker.bind(null, ['settings'])],
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
      browser.refreshMainMenu();

      notification(t('notifications:settingsSaved.title'), t('notifications:settingsSaved.body'));

      return config.config;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ name: string; color: string; win: Window }>(
    'config:create-tag',
    'handle',
    browser,
    [windowChecker, modalChecker],
    async ({ name, color, win }) => {
      try {
        const tag = config.createTag(name, color);

        browser.toRenderer.refreshTabContainers(win);

        return tag;
      } catch (error) {
        scopeLog.error('Error creating tag:', error);
        return null;
      }
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tags: { name: string; color: string }[] }>(
    'config:save-tags',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['settings'])],
    async ({ tags }) => {
      try {
        config.saveTags(tags);
      } catch (error) {
        scopeLog.error('Error saving tags:', error);
        notification(t('notifications:settingsSaved.title'), t('notifications:settingsSaved.body'));
        return null;
      }

      browser.toRenderer.refreshConfig();

      for (const window of browser.windows) {
        browser.toRenderer.refreshTabContainers(window);
      }

      notification(t('notifications:settingsSaved.title'), t('notifications:settingsSaved.body'));

      return config.config;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tagId: TTabTagId }>(
    'config:delete-tag',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['settings'])],
    async ({ tagId }) => {
      config.removeTag(tagId);

      browser.toRenderer.refreshConfig();

      for (const window of browser.windows) {
        browser.toRenderer.refreshTabContainers(window);
      }

      return config.config;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tabData: IWinDesConTab }>(
    'config:select-download-folder',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['settings'])],
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
    [internalPageChecker.bind(null, ['settings'])],
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
    [internalPageChecker.bind(null, ['settings'])],
    async ({}) => {
      shell.showItemInFolder(userDataPath());
    },
  );
}
