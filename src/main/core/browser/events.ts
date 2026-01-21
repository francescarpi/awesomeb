import { TWindowId } from '@shared/types';
import { Browser } from './browser';
import log from 'electron-log';

const scopeLog = log.scope('BrowserEvents');

export function registerBrowserEvents(browser: Browser) {
  //--------------------------------------------------------------------------------------
  browser.eventsChannel.on('ui:window-focused', async (_winId: TWindowId) => {
    scopeLog.info('Window focused event received, refreshing main menu');
    await browser.refreshMainMenu();
  });
}
