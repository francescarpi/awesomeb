import { TDesktopId, TWindowId } from '@shared/types';
import { Browser, Window } from '@main/core';
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
    async (window: Window, _selectedDesktopId: TDesktopId) => {
      browser.rendererEmmiter.refreshDesktops(window);
    },
  );
}
