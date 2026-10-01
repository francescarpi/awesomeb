import { Browser, Window } from '@/core';
import { createHandler, windowChecker } from '@/utils';

export function setupAppUpdaterIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'appupdater:version-available',
    'handle',
    browser,
    [windowChecker],
    async ({}) => {
      return browser.appUpdater.versionAvailable;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{}>('appupdater:install', 'on', browser, [windowChecker], async ({}) => {
    browser.appUpdater.quitAndInstall();
  });

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'appupdater:download',
    'on',
    browser,
    [windowChecker],
    async ({ win }) => {
      win.closeContextualModal();
      if (browser.appUpdater.versionAvailable) {
        browser.appUpdater.downloadUpdate();
      }
    },
  );
}
