import { TWindowId } from '~/types';
import { Browser, Window, Desktop, Tab } from '@/core';
import log from 'electron-log';
import { refreshUrlBarOrTab } from './events.herlpers';

const scopeLog = log.scope('BrowserEvents');

export function registerBrowserEvents(browser: Browser) {
  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:focus', async (winId: TWindowId) => {
    scopeLog.info('Window focused event received');
    browser.setActiveWindowId(winId);
    await browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:blur', async (_winId: TWindowId) => {
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

      window.refreshVisibleTabView();
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
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('window:tab-did-suspend', async (window: Window) => {
    browser.rendererEmmiter.refreshTabContainers(window);
    browser.rendererEmmiter.refreshURLBar(window, null);
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
}
