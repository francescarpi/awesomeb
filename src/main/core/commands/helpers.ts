import { Tab, Browser } from '@/core';
import { TTabId } from '~/types';

export function getTab(browser: Browser, activeTab: Tab, tabId?: TTabId): Tab | null {
  if (tabId) {
    const targetTab = browser.getTab(tabId);
    if (!targetTab) {
      return null;
    }

    return targetTab.tab;
  }
  return activeTab;
}
