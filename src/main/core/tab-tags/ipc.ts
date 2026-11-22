import { Browser } from '@/core';
import { createHandler, windowChecker, tabChecker } from '@/utils';
import type { TTabId, TTabTagId } from '~/types';

export function setupTabTagsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ tabId: TTabId; tagId: TTabTagId }>(
    'tabtags:assign',
    'handle',
    browser,
    [windowChecker, tabChecker],
    async ({ tabId, tagId }) => {
      browser.tabTags.assign(tabId, tagId);

      return browser.tabTags.get(tabId);
    },
  );
}
