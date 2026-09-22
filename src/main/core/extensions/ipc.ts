import { Browser, Window } from '@/core';
import { TExtensionId, TWindowId, IWinDesConTab, IExtension } from '~/types';
import { type IpcMainServiceWorkerInvokeEvent, type Session } from 'electron';
import log from 'electron-log';
import {
  internalPageChecker,
  createHandler,
  viewChecker,
  extensionChecker,
  windowChecker,
  windowActiveChecker,
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
    [windowActiveChecker, viewChecker.bind(null, ['extension-popup'])],
    async ({ win, width, height }) => {
      browser.extensions.iniPopup(win, width, height);
    },
  );

  //--------------------------------------------------------------------------------
  createHandler<{
    win: Window;
    extension: IExtension;
    action: { method: string; args: Record<string, unknown> };
  }>(
    'extensions:crx-message',
    'handle',
    browser,
    [windowActiveChecker, extensionChecker],
    async ({ win, extension, action }) => {
      return await browser.extensions.chrome.dispatch(
        win,
        extension.id,
        action.method,
        action.args,
      );
    },
  );
}

export function setupExtensionsServiceWorkerIPC(browser: Browser, ses: Session) {
  const registeredWorkers = new WeakSet<object>();

  const registerForVersion = (versionId: number) => {
    const worker = ses.serviceWorkers.getWorkerFromVersionID(versionId);
    if (!worker) return;
    if (registeredWorkers.has(worker)) return;

    registeredWorkers.add(worker);
    worker.ipc.handle(
      'extensions:crx-message',
      async (
        _event: IpcMainServiceWorkerInvokeEvent,
        rawArgs: {
          extensionId?: TExtensionId;
          action?: { method: string; args: Record<string, unknown> };
        },
      ) => {
        const { extensionId, action } = rawArgs;
        const win = browser.activeWindow;
        if (!win || !extensionId || !action) {
          scopeLog.warn('[extensions:crx-message] Invalid service worker request');
          return;
        }

        const expectedPrefix = `chrome-extension://${extensionId}/`;
        if (!worker.scriptURL.startsWith(expectedPrefix)) {
          scopeLog.warn('[extensions:crx-message] Service worker URL does not match extension ID', {
            expectedPrefix,
            actual: worker.scriptURL,
          });
          return;
        }

        const extension = browser.extensions.getExtension(extensionId);
        if (!extension) {
          scopeLog.warn(`[extensions:crx-message] No extension found with ID ${extensionId}`);
          return;
        }

        return await browser.extensions.chrome.dispatch(
          win,
          extension.id,
          action.method,
          action.args,
        );
      },
    );
  };

  ses.serviceWorkers.on('running-status-changed', (details) => {
    if (details.runningStatus === 'running') registerForVersion(details.versionId);
  });

  for (const versionId of Object.keys(ses.serviceWorkers.getAllRunning())) {
    registerForVersion(Number(versionId));
  }
}
