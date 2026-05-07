import { Browser, Window } from '@/core';
import log from 'electron-log';
import {
  createHandler,
  windowChecker,
  viewChecker,
  conditionalChecker,
  internalPageChecker,
} from '@/utils';
import { INTERNAL_PROTOCOL } from '~/constants';

const scopeLog = log.scope('DownloadsIPC');

export function setupDownloadsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'downloads:open-page',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar', 'contextual-modal'])],
    async ({ win }) => {
      win.closeContextualModal();

      let downloadsFound = false;

      for (const tabData of win.tabs) {
        if (tabData.tab.url === `${INTERNAL_PROTOCOL}://downloads/`) {
          win.selectTab(tabData.tab.id);
          downloadsFound = true;
          break;
        }
      }

      if (!downloadsFound) {
        browser.openURL(`${INTERNAL_PROTOCOL}://downloads/`, { selectTab: true });
      }
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ savePath: string; action: 'cancel' | 'pause' | 'resume' | 'open' }>(
    'downloads:action',
    'on',
    browser,
    [
      conditionalChecker.bind(
        null,
        (args) => typeof args.winId === 'number',
        [windowChecker, viewChecker.bind(null, ['contextual-modal'])],
        [internalPageChecker.bind(null, 'downloads')],
      ),
    ],
    async ({ savePath, action }) => {
      const performAction = () => {
        const downloadItem = browser.downloads.get(savePath);
        if (!downloadItem) {
          scopeLog.warn(`No download item found for save path ${savePath}`);
          return;
        }

        switch (action) {
          case 'cancel':
            downloadItem.cancel();
            break;
          case 'pause':
            downloadItem.pause();
            break;
          case 'resume':
            downloadItem.resume();
            break;
          case 'open':
            downloadItem.open();
            break;
        }
      };
      return performAction();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'downloads:get',
    'handle',
    browser,
    [
      conditionalChecker.bind(
        null,
        (args) => typeof args.winId === 'number',
        [windowChecker, viewChecker.bind(null, ['contextual-modal'])],
        [internalPageChecker.bind(null, 'downloads')],
      ),
    ],
    async () => {
      return browser.renderer.downloads();
    },
  );
}
