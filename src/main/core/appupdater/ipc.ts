import { Browser, Window } from '@/core';
import { createHandler, windowChecker, viewChecker } from '@/utils';

export function setupAppUpdaterIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'appupdater:version-available',
    'handle',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar', 'contextual-modal'])],
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
      browser.appUpdater.quitAndInstall();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'appupdater:download',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['contextual-modal'])],
    async ({ win }) => {
      win.closeContextualModal();
      if (browser.appUpdater.versionAvailable) {
        browser.appUpdater.downloadUpdate();
      }
    },
  );
}
