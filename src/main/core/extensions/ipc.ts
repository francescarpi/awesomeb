import { Browser, Window } from '@/core';
import { TExtensionId, TWindowId, TPartitionId, IWinDesConTab, IExtension } from '~/types';
import log from 'electron-log';
import {
  internalPageChecker,
  createHandler,
  viewChecker,
  extensionChecker,
  windowChecker,
} from '@/utils';

const scopeLog = log.scope('ExtensionsIPC');

export function setupExtensionsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------
  createHandler(
    'extensions:get',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['extensions'])],
    async () => browser.renderer.extensions(),
  );

  //--------------------------------------------------------------------------------
  createHandler(
    'extensions:refresh',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['extensions'])],
    async () => {
      browser.extensions.refresh();
      return browser.renderer.extensions();
    },
  );

  //--------------------------------------------------------------------------------
  createHandler<{ tabData: IWinDesConTab; id: TExtensionId }>(
    'extensions:toggle',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['extensions'])],
    async ({ id: extensionId }) => {
      browser.extensions.toggle(extensionId);
      return browser.renderer.extensions();
    },
  );

  //--------------------------------------------------------------------------------
  createHandler<{ win: Window; winId: TWindowId; extensionId: TExtensionId; x: number; y: number }>(
    'extensions:open-popup',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['urlbar'])],
    async ({ win, winId, extensionId, x, y }) => {
      const selectedTab = win.selectedTab;
      if (!selectedTab) {
        scopeLog.warn('No selected tab found for window', { winId });
        return;
      }
      browser.extensions.openPopup(extensionId, win, selectedTab.tab.partition, x, y);
    },
  );

  //--------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'extensions:close-popup',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['extension-popup-overlay'])],
    async ({ win }) => {
      browser.extensions.closePopup(win);
    },
  );

  //--------------------------------------------------------------------------------
  createHandler<{ win: Window; winId: TWindowId; width: number; height: number }>(
    'extensions:ini-popup',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['extension-popup'])],
    async ({ win, width, height }) => {
      browser.extensions.iniPopup(win, width, height);
    },
  );

  //--------------------------------------------------------------------------------
  createHandler<{
    win: Window;
    extension: IExtension;
    winId: TWindowId;
    partitionId: TPartitionId;
    extensionId: TExtensionId;
    action: { method: string; args: Record<string, unknown> };
  }>(
    'extensions:crx-message',
    'handle',
    browser,
    [windowChecker, extensionChecker],
    async ({ win, partitionId, extension, action }) => {
      return await browser.extensions.chrome.dispatch(
        win,
        partitionId,
        extension.id,
        action.method,
        action.args,
      );
    },
  );
}
