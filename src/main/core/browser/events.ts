import { TFindInPageId, TTabId, TWindowId } from '~/types';
import { Browser, Window, Desktop, Tab, TabContainer, notification } from '@/core';
import log from 'electron-log';
import { refreshUrlBarOrTab } from './events.herlpers';
import { UIPageView } from '@/ui';
import { Download } from '../downloads/download';

const scopeLog = log.scope('BrowserEvents');

export function registerBrowserEvents(browser: Browser) {
  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:window-focus', async (winId: TWindowId) => {
    scopeLog.info('Window focused event received');
    browser.setActiveWindowId(winId);

    const selectedTabResult = browser.selectedTab;
    if (selectedTabResult && selectedTabResult.window.id === winId) {
      selectedTabResult.tab.focus();
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
      browser.toRenderer.refreshDesktops(window);
      browser.toRenderer.refreshSelectedDesktop(window);
      browser.toRenderer.refreshThemes(window, desktop);
      browser.toRenderer.refreshTabContainers(window);
      browser.toRenderer.refreshURLBar(window, desktop.selectedTab?.tab || null);
      browser.toRenderer.refreshTabNavigation(window, desktop.selectedTab?.tab || undefined);
      browser.toRenderer.refreshExtensions(window);
      browser.toRenderer.refreshLayoutData(window);

      window.renderViews();
      browser.refreshMainMenu();
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('desktop:name-did-change', async (window: Window, _desktop: Desktop) => {
    browser.toRenderer.refreshDesktops(window);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('desktop:theme-did-change', async (window: Window, desktop: Desktop) => {
    browser.toRenderer.refreshThemes(window, desktop);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:selected-tab-did-change', async (window: Window, tab: Tab) => {
    browser.toRenderer.refreshTabSwitcher(window);
    browser.toRenderer.refreshTabContainers(window);
    browser.toRenderer.refreshURLBar(window, tab);
    browser.toRenderer.refreshDesktops(window);
    browser.toRenderer.refreshSelectedDesktop(window);
    browser.toRenderer.refreshExtensions(window);
    browser.toRenderer.refreshShowSplitMenu(window);
    browser.toRenderer.refreshLayoutData(window);

    const result = browser.getTab(tab.id)!;
    browser.toRenderer.refreshThemes(window, result.desktop);

    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:tab-did-resume', async (window: Window, tab: Tab) => {
    await tab.loadHistoryOrURL();
    browser.toRenderer.refreshShowSplitMenu(window);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:tab-did-suspend', async (window: Window) => {
    browser.toRenderer.refreshTabSwitcher(window);
    browser.toRenderer.refreshTabContainers(window);
    browser.toRenderer.refreshURLBar(window, null);
    browser.toRenderer.refreshDesktops(window);
    browser.toRenderer.refreshTabNavigation(window);
    browser.toRenderer.refreshExtensions(window);
    browser.toRenderer.refreshLayoutData(window);
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
    browser.toRenderer.refreshTabContainers(window);
    browser.toRenderer.refreshURLBar(window, null);
    browser.toRenderer.refreshDesktops(window);
    browser.toRenderer.refreshTabNavigation(window);
    browser.toRenderer.refreshExtensions(window);
    browser.toRenderer.refreshLayoutData(window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('browser:url-opened', async (window: Window) => {
    browser.toRenderer.refreshTabSwitcher(window);
    browser.toRenderer.refreshTabContainers(window);
    browser.toRenderer.refreshURLBar(window, null);
    browser.toRenderer.refreshDesktops(window);
    browser.toRenderer.refreshExtensions(window);
    browser.toRenderer.refreshLayoutData(window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'tab:find-in-page-visibility-did-change',
    async (tab: Tab, visible: boolean, view: UIPageView) => {
      const result = browser.getTab(tab.id);
      if (!result) {
        scopeLog.warn(`Tab with id ${tab.id} not found for find in page visibility change event`);
        return;
      }

      if (visible) {
        result.window.addView(view);
      } else {
        result.window.removeView(view.viewId);
      }

      result.window.renderViews();
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
        result.window.removeView(view.viewId);
      }

      result.window.renderViews();
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

      browser.toRenderer.refreshTabFindInPageResult(result.tab, requestId);
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
      browser.toRenderer.refreshTabContainers(tabContainerResult.window);
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tab:require-attention-did-change', async (tab: Tab) => {
    const tabResult = browser.getTab(tab.id);
    if (!tabResult) {
      return;
    }
    browser.toRenderer.refreshDesktops(tabResult.window);
    browser.toRenderer.refreshTabContainers(tabResult.window);
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
      browser.toRenderer.refreshDesktops(targetWindow);
      browser.toRenderer.refreshTabContainers(targetWindow);
      browser.toRenderer.refreshURLBar(targetWindow, null);

      if (targetWindow.id !== sourceWindow.id) {
        browser.toRenderer.refreshDesktops(sourceWindow);
        browser.toRenderer.refreshTabContainers(sourceWindow);
        browser.toRenderer.refreshURLBar(sourceWindow, null);
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
      browser.toRenderer.refreshTabContainers(window);
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('downloads:updated', async () => {
    browser.toRenderer.refreshDownloads();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('downloads:completed', async (download: Download) => {
    notification(
      'Download Completed',
      `File "${download.fileName}" has been downloaded successfully.`,
      () => download.open(),
    );
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:layout-did-change', async (window: Window) => {
    window.renderViews();
    browser.toRenderer.refreshLayoutData(window);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'tab:certificate-error-did-change',
    async (tab: Tab, visible: boolean) => {
      const result = browser.getTab(tab.id);
      if (!result) {
        return;
      }

      if (visible) {
        const certificateErrorView = result.tab.certificateError;
        if (!certificateErrorView) {
          scopeLog.warn(`Certificate error view not found for Tab with id ${tab.id}`);
          return;
        }
        result.window.addView(certificateErrorView);
      } else {
        result.window.removeView(`certificate-error-tab-${tab.id}`);
      }

      result.window.renderViews();
    },
  );

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tabpreview:closed', async (window: Window) => {
    browser.toRenderer.refreshTabContainers(window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tabpreview:split', async (window: Window, tab: Tab) => {
    browser.toRenderer.refreshTabSwitcher(window);
    browser.toRenderer.refreshTabContainers(window);
    browser.toRenderer.refreshURLBar(window, tab);
    browser.toRenderer.refreshDesktops(window);
    browser.toRenderer.refreshShowSplitMenu(window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tabpreview:accepted', async (window: Window, tab: Tab) => {
    browser.toRenderer.refreshTabSwitcher(window);
    browser.toRenderer.refreshTabContainers(window);
    browser.toRenderer.refreshURLBar(window, tab);
    browser.toRenderer.refreshDesktops(window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tab:audio-mute-did-change', async (tab: Tab) => {
    const result = browser.getTab(tab.id);
    if (!result) {
      return;
    }
    browser.toRenderer.refreshTabContainers(result.window);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('extensions:enabled-changed', async () => {
    for (const window of browser.windows) {
      browser.toRenderer.refreshExtensions(window);
    }
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('extensions:icon-updated', async () => {
    for (const window of browser.windows) {
      browser.toRenderer.refreshExtensions(window);
    }
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tabcontainer:layout-did-change', async () => {
    const selectedTab = browser.selectedTab;
    if (!selectedTab) {
      return;
    }

    selectedTab.window.renderViews();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tabcontainer:tabs-rotated', async () => {
    const selectedTab = browser.selectedTab;
    if (!selectedTab) {
      return;
    }
    selectedTab.window.renderViews();
    browser.toRenderer.refreshTabContainers(selectedTab.window);
    browser.toRenderer.refreshTabSwitcher(selectedTab.window);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tabcontainer:did-unsplit', async (win: Window, _desktop: Desktop) => {
    browser.toRenderer.refreshTabContainers(win);
    browser.toRenderer.refreshTabSwitcher(win);
    browser.toRenderer.refreshShowSplitMenu(win);
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('tabcontainer:layout-size-did-change', async () => {
    const selectedTab = browser.selectedTab;
    if (!selectedTab) {
      return;
    }
    selectedTab.window.renderViews();
  });
}
