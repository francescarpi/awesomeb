import { Browser, Tab } from '@/core';
import log from 'electron-log';

const scopeLog = log.scope('BrowserEventsHelpers');

export async function refreshUrlBarOrTab(browser: Browser, tab: Tab) {
  const result = browser.getTab(tab.id);
  if (!result) {
    return;
  }

  const { window, desktop } = result;

  const selectedDesktop = window.selectedDesktop;
  const selectedTab = selectedDesktop.selectedTab;

  let someChanged = false;

  if (selectedTab?.tab.id === tab.id) {
    browser.rendererEmmiter.refreshURLBar(window, tab);
    browser.rendererEmmiter.refreshTabNavigation(window, tab);
    someChanged = true;
  }

  if (desktop.id === selectedDesktop.id) {
    await browser.rendererEmmiter.refreshTab(window, desktop, tab);
    someChanged = true;
  }

  if (someChanged) {
    browser.refreshMainMenu();
    scopeLog.info('Refreshed URL bar or tab for tab with id', tab.id);
  }
}
