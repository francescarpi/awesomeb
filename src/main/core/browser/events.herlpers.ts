import { Browser, Tab } from '@/core';
import log from 'electron-log';

const scopeLog = log.scope('BrowserEventsHelpers');

export function refreshUrlBarOrTab(browser: Browser, tab: Tab) {
  const result = browser.getTab(tab.id);
  if (!result) {
    scopeLog.warn('Could not find tab with id', tab.id, 'to refresh URL bar or tab');
    return;
  }

  const { window, desktop } = result;

  const selectedDesktop = window.selectedDesktop;
  const selectedTab = selectedDesktop.selectedTab;

  let someChanged = false;

  if (selectedTab?.tab.id === tab.id) {
    browser.toRenderer.refreshURLBar(window, tab);
    browser.toRenderer.refreshTabNavigation(window, tab);
    someChanged = true;
  }

  if (desktop.id === selectedDesktop.id) {
    browser.toRenderer.refreshTabContainers(window);
    someChanged = true;
  }

  if (someChanged) {
    browser.refreshMainMenu();
    scopeLog.info('Refreshed URL bar or tab for tab with id', tab.id);
  } else {
    scopeLog.debug('No need to refresh URL bar or tab for tab with id', tab.id);
  }
}
