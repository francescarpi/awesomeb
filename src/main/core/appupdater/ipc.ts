import { Browser } from '@/core';
import { createHandler, windowChecker, viewChecker } from '@/utils';
import { autoUpdater } from 'electron-updater';

export function setupAppUpdaterIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'appupdater:version-available',
    'handle',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar'])],
    async ({}) => {
      return browser.appUpdater.versionAvailable;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'appupdater:install',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar'])],
    async ({}) => {
      if (browser.appUpdater.versionAvailable) {
        autoUpdater.quitAndInstall();
      }
    },
  );
}
