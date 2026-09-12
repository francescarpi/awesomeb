import { Browser, Tab } from '@/core';
import { TTabId, TWindowId } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('BrowserEventsHelpers');

/**
 * Coalesced refresh of the "single tab changed" path.
 *
 * Tab events like `did-start-loading` → `did-navigate` → `page-title-updated` →
 * `page-favicon-updated` → `did-stop-loading` fire several times within the same
 * macrotask. Instead of pushing a refresh round per event, we queue the touched
 * tab per window and flush once on the next tick, sending a lightweight
 * per-tab update (`tabs:refresh-one`) rather than the whole tab tree.
 */

interface PendingWindowRefresh {
  windowId: TWindowId;
  tabIds: Set<TTabId>;
  refreshDesktops: boolean;
}

const pendingRefreshes = new Map<TWindowId, PendingWindowRefresh>();
let flushScheduled = false;

export function refreshUrlBarOrTab(browser: Browser, tab: Tab) {
  const result = browser.getTab(tab.id);
  if (!result) {
    scopeLog.warn('Could not find tab with id', tab.id, 'to refresh URL bar or tab');
    return;
  }

  queueRefresh(browser, {
    windowId: result.window.id,
    tabId: tab.id,
    refreshDesktops: false,
  });
}

export function refreshTabAttentionState(browser: Browser, tab: Tab) {
  const result = browser.getTab(tab.id);
  if (!result) {
    scopeLog.warn('Could not find tab with id', tab.id, 'to refresh attention state');
    return;
  }

  queueRefresh(browser, {
    windowId: result.window.id,
    tabId: tab.id,
    refreshDesktops: true,
  });
}

function queueRefresh(
  browser: Browser,
  entry: { windowId: TWindowId; tabId: TTabId; refreshDesktops: boolean },
) {
  let pending = pendingRefreshes.get(entry.windowId);
  if (!pending) {
    pending = {
      windowId: entry.windowId,
      tabIds: new Set(),
      refreshDesktops: entry.refreshDesktops,
    };
    pendingRefreshes.set(entry.windowId, pending);
  }

  pending.tabIds.add(entry.tabId);
  pending.refreshDesktops ||= entry.refreshDesktops;

  if (!flushScheduled) {
    flushScheduled = true;
    setTimeout(() => {
      flushScheduled = false;
      flushPendingRefreshes(browser);
    }, 0);
  }
}

function flushPendingRefreshes(browser: Browser) {
  const entries = Array.from(pendingRefreshes.values());
  pendingRefreshes.clear();

  for (const entry of entries) {
    const window = browser.getWindow(entry.windowId);
    if (!window) {
      scopeLog.debug('Window no longer exists, skipping pending refresh:', entry.windowId);
      continue;
    }

    const selectedDesktop = window.selectedDesktop;
    const selectedTab = selectedDesktop.selectedTab;

    let someChanged = false;

    if (entry.refreshDesktops) {
      browser.toRenderer.refreshDesktops(window);
      someChanged = true;
    }

    if (selectedTab && entry.tabIds.has(selectedTab.tab.id)) {
      browser.toRenderer.refreshURLBar(window, selectedTab.tab);
      browser.toRenderer.refreshTabNavigation(window, selectedTab.tab);
      someChanged = true;
    }

    for (const tabId of entry.tabIds) {
      const result = browser.getTab(tabId);
      if (!result) {
        scopeLog.debug('Tab no longer exists, skipping single tab refresh:', tabId);
        continue;
      }

      if (result.desktop.id !== selectedDesktop.id) {
        continue;
      }

      browser.toRenderer.refreshOneTab(window, result.desktop, result.tab);
      someChanged = true;
    }

    if (someChanged) {
      browser.refreshMainMenu();
      scopeLog.info(
        'Coalesced refresh of URL bar and tabs for window',
        window.id,
        'from',
        entry.tabIds.size,
        'tab event(s)',
      );
    } else {
      scopeLog.debug('No need to refresh URL bar or tab for window', window.id);
    }
  }
}
