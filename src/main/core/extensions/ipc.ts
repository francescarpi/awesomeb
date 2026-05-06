import { Browser, Window } from '@/core';
import { TExtensionId, TWindowId, TPartitionId, IWinDesConTab, IExtension } from '~/types';
import log from 'electron-log';
import { internalPageChecker, createHandler, viewChecker, extensionChecker } from '@/utils';

const scopeLog = log.scope('ExtensionsIPC');

export function setupExtensionsIPC(browser: Browser) {
  createHandler(
    'extensions:get',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'extensions')],
    async () => browser.renderer.extensions(),
  );

  createHandler(
    'extensions:refresh',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'extensions')],
    async () => {
      browser.extensions.refresh();
      return browser.renderer.extensions();
    },
  );

  createHandler<[IWinDesConTab, TExtensionId]>(
    'extensions:toggle',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'extensions')],
    async (args) => {
      const [_tabResult, id] = args;
      browser.extensions.toggle(id as TExtensionId);
      return browser.renderer.extensions();
    },
  );

  createHandler<[Window, TWindowId, TExtensionId]>(
    'extensions:open-popup',
    'on',
    browser,
    [viewChecker.bind(null, 'urlbar')],
    async (args) => {
      const [win, winId, extensionId] = args;
      const selectedTab = win.selectedTab;
      if (!selectedTab) {
        scopeLog.warn('No selected tab found for window', { winId });
        return;
      }
      browser.extensions.openPopup(extensionId, win, selectedTab.tab.partition);
    },
  );

  createHandler<[Window]>(
    'extensions:close-popup',
    'on',
    browser,
    [viewChecker.bind(null, 'extension-popup-overlay')],
    async (args) => {
      const [win] = args;
      browser.extensions.closePopup(win);
    },
  );

  createHandler<[Window, TWindowId, number, number]>(
    'extensions:ini-popup',
    'on',
    browser,
    [viewChecker.bind(null, 'extension-popup')],
    async (args) => {
      const [win, _winId, width, height] = args;
      browser.extensions.iniPopup(win, width, height);
    },
  );

  createHandler<
    [
      Window,
      IExtension,
      TWindowId,
      TPartitionId,
      TExtensionId,
      { method: string; args: Record<string, unknown> },
    ]
  >('extensions:crx-message', 'handle', browser, [extensionChecker], async (args) => {
    const [win, extension, _winId, partitionId, _extensionId, action] = args;
    return await browser.extensions.chrome.dispatch(
      win,
      partitionId,
      extension.id,
      action.method,
      action.args,
    );
  });
}
