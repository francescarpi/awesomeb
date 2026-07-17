import { Tab, Browser, Window, TabContainer } from '@/core';
import { TTabId, TTabContainerId } from '~/types';

export function getTab(browser: Browser, activeTab: Tab | null, tabId?: TTabId): Tab | null {
  if (tabId) {
    const targetTab = browser.getTab(tabId);
    if (!targetTab) {
      return null;
    }

    return targetTab.tab;
  }
  return activeTab;
}

export function getTabContainer(
  window: Window,
  activeTabContainer: TabContainer | null,
  tabContainerId?: TTabContainerId,
): TabContainer | null {
  if (tabContainerId) {
    const walk = (tc: TabContainer): TabContainer | null => {
      if (tc.id === tabContainerId) return tc;
      for (const child of tc.children) {
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };

    for (const desktop of window.desktops) {
      for (const tc of desktop.tabContainers) {
        const found = walk(tc);
        if (found) return found;
      }
    }

    return null;
  }
  return activeTabContainer;
}
