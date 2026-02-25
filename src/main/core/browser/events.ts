import { TFindInPageId, TTabId, TWindowId } from '~/types';
import { Browser, Window, Desktop, Tab, TabContainer, notification } from '@/core';
import log from 'electron-log';
import { refreshUrlBarOrTab } from './events.herlpers';
import { UIPageView } from '@/ui';

const scopeLog = log.scope('BrowserEvents');

export function registerBrowserEvents(browser: Browser) {
  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:window-focus', async (winId: TWindowId) => {
    scopeLog.info('Window focused event received');
    browser.setActiveWindowId(winId);

    const selectedTabResult = browser.selectedTab;
    if (selectedTabResult && selectedTabResult.window.id === winId) {
      selectedTabResult.tab.view.focus();
    }

    await browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:window-blur', async (_winId: TWindowId) => {
    scopeLog.info('Window blur event received');
    browser.setActiveWindowId(null);
    await browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'window:selected-desktop-did-change',
    async (window: Window, desktop: Desktop) => {
      browser.rendererEmmiter.refreshDesktops(window);
      browser.rendererEmmiter.refreshThemes(window, desktop);
      browser.rendererEmmiter.refreshTabContainers(window);
      browser.rendererEmmiter.refreshURLBar(window, desktop.selectedTab?.tab || null);

      window.refreshTabsVisibility();
      browser.refreshMainMenu();
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('desktop:name-did-change', async (window: Window, _desktop: Desktop) => {
    browser.rendererEmmiter.refreshDesktops(window);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('desktop:theme-did-change', async (window: Window, desktop: Desktop) => {
    browser.rendererEmmiter.refreshThemes(window, desktop);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:selected-tab-did-change', async (window: Window, tab: Tab) => {
    browser.rendererEmmiter.refreshTabContainers(window);
    browser.rendererEmmiter.refreshURLBar(window, tab);
    browser.rendererEmmiter.refreshDesktops(window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:tab-did-resume', async (_window: Window, tab: Tab) => {
    await tab.loadHistoryOrURL();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:tab-did-suspend', async (window: Window) => {
    browser.rendererEmmiter.refreshTabContainers(window);
    browser.rendererEmmiter.refreshURLBar(window, null);
    browser.rendererEmmiter.refreshDesktops(window);
    browser.rendererEmmiter.refreshTabNavigation(window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tab:loading-did-change', async (tab: Tab) => {
    refreshUrlBarOrTab(browser, tab);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tab:url-did-change', async (tab: Tab) => {
    refreshUrlBarOrTab(browser, tab);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tab:title-did-change', async (tab: Tab) => {
    refreshUrlBarOrTab(browser, tab);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:tab-did-close', async (window: Window) => {
    browser.rendererEmmiter.refreshTabContainers(window);
    browser.rendererEmmiter.refreshURLBar(window, null);
    browser.rendererEmmiter.refreshDesktops(window);
    browser.rendererEmmiter.refreshTabNavigation(window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('browser:url-opened', async (window: Window) => {
    browser.rendererEmmiter.refreshTabContainers(window);
    browser.rendererEmmiter.refreshURLBar(window, null);
    browser.rendererEmmiter.refreshDesktops(window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'tab:find-in-page-visibility-did-change',
    async (tab: Tab, visible: boolean, view: UIPageView) => {
      const result = browser.getTab(tab.id);
      if (!result) {
        return;
      }

      // TODO maybe 'visible' and 'view' is not necessary. Check findInpage tab's property

      if (visible) {
        result.window.addView(view);
      } else {
        result.window.removeView(view.id);
      }

      result.window.refreshTabsVisibility();
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'tab:fail-load-did-change',
    async (tab: Tab, visible: boolean, view: UIPageView) => {
      const result = browser.getTab(tab.id);
      if (!result) {
        scopeLog.warn(`Tab with id ${tab.id} not found for fail load event`);
        return;
      }

      if (visible) {
        result.window.addView(view);
      } else {
        result.window.removeView(view.id);
      }

      result.window.refreshTabsVisibility();
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'tab:find-in-page-result-did-change',
    async (tabId: TTabId, requestId: TFindInPageId) => {
      const result = browser.getTab(tabId);
      if (!result) {
        return;
      }

      browser.rendererEmmiter.refreshTabFindInPageResult(result.tab, requestId);
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'tabcontainer:divider-did-change',
    async (tabContainer: TabContainer) => {
      const tabContainerResult = browser.getTabContainer(tabContainer.id);
      if (!tabContainerResult) {
        return;
      }
      browser.rendererEmmiter.refreshTabContainers(tabContainerResult.window);
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tab:require-attention-did-change', async (tab: Tab) => {
    const tabResult = browser.getTab(tab.id);
    if (!tabResult) {
      return;
    }
    browser.rendererEmmiter.refreshDesktops(tabResult.window);
    browser.rendererEmmiter.refreshTabContainers(tabResult.window);
    await browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'browser:tab-did-move',
    async (
      _tabId: TTabId,
      sourceWindow: Window,
      _sourceDesktop: Desktop,
      targetWindow: Window,
      _targetDesktop: Desktop,
    ) => {
      browser.rendererEmmiter.refreshDesktops(targetWindow);
      browser.rendererEmmiter.refreshTabContainers(targetWindow);
      browser.rendererEmmiter.refreshURLBar(targetWindow, null);

      if (targetWindow.id !== sourceWindow.id) {
        browser.rendererEmmiter.refreshDesktops(sourceWindow);
        browser.rendererEmmiter.refreshTabContainers(sourceWindow);
        browser.rendererEmmiter.refreshURLBar(sourceWindow, null);
      }

      await browser.refreshMainMenu();
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tab:favicon-did-change', async (tab: Tab) => {
    refreshUrlBarOrTab(browser, tab);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'desktop:tabcontainers-order-did-change',
    async (window: Window, _desktop: Desktop) => {
      browser.rendererEmmiter.refreshTabContainers(window);
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('downloads:updated', async () => {
    browser.rendererEmmiter.refreshDownloads();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('downloads:completed', async (fileName: string) => {
    notification('Download Completed', `File "${fileName}" has been downloaded successfully.`);
  });
}
