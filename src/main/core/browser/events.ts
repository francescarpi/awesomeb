import { TWindowId } from '~/types';
import { Browser, Window, Desktop } from '@/core';
import log from 'electron-log';

const scopeLog = log.scope('BrowserEvents');

export function registerBrowserEvents(browser: Browser) {
  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('ui:window-focused', async (_winId: TWindowId) => {
    scopeLog.info('Window focused event received, refreshing main menu');
    await browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on(
    'window:selected-desktop-did-change',
    async (window: Window, desktop: Desktop) => {
      browser.rendererEmmiter.refreshDesktops(window);
      browser.rendererEmmiter.refreshThemes(window, desktop);
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
}
