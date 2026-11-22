import { Browser, Window } from '@/core';
import { createHandler, windowChecker, tabChecker } from '@/utils';
import type { TTabId, TTabTagId } from '~/types';

export function setupTabTagsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ tabId: TTabId; tagId: TTabTagId; win: Window }>(
    'tabtags:assign',
    'handle',
    browser,
    [windowChecker, tabChecker],
    async ({ tabId, tagId, win }) => {
      browser.tabTags.assign(tabId, tagId);

      browser.toRenderer.refreshTabContainers(win);

      return browser.tabTags.get(tabId);
    },
  );
}
