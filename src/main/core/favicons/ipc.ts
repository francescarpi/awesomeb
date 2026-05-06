import { Browser, getCachedFavicon, Window } from '@/core';
import { TTabId } from '~/types';
import { createHandler, windowChecker, viewChecker } from '@/utils';
import log from 'electron-log';

const scopeLog = log.scope('FaviconsIPC');

export function setupFaviconsIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; tabId: TTabId }>(
    'favicons:get',
    'handle',
    browser,
    [windowChecker, viewChecker.bind(null, ['tab-switcher'])],
    async ({ win, tabId }) => {
      const tabData = win.getTab(tabId);
      if (!tabData) {
        scopeLog.error(`No tab found with ID ${tabId} in window ${win.id}`);
        return null;
      }

      if (tabData.tab.favicon) {
        return tabData.tab.favicon;
      }

      if (tabData.tab.url) {
        return await getCachedFavicon(tabData.tab.url);
      }

      return null;
    },
  );
}
