import { Browser, Window } from '@/core';
import { TExtensionId, TWindowId, IWinDesConTab, IExtension } from '~/types';
import {
  type IpcMainInvokeEvent,
  type IpcMainServiceWorkerInvokeEvent,
  type Session,
} from 'electron';
import log from 'electron-log';
import {
  internalPageChecker,
  createHandler,
  viewChecker,
  extensionChecker,
  windowChecker,
  windowActiveChecker,
} from '@/utils';
import {
  RuntimeBus,
  RUNTIME_SEND_MESSAGE_CHANNEL,
  RUNTIME_SEND_RESPONSE_CHANNEL,
  type RuntimeContext,
  type RuntimeMessageEnvelope,
} from './runtime-bus';

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
      const selectedTab = browser.selectedTab;
      if (!selectedTab) {
        scopeLog.warn('No selected tab');
        return;
      }

      return await browser.extensions.chrome.dispatch(
        win,
        selectedTab.tab.partition.id,
        extension.id,
        action.method,
        action.args,
      );
    },
  );

  //--------------------------------------------------------------------------------
  createHandler<{
    extensionId: TExtensionId;
    message: unknown;
    responseKey: string;
    senderContext: RuntimeContext;
    event: IpcMainInvokeEvent | IpcMainServiceWorkerInvokeEvent;
  }>(RUNTIME_SEND_MESSAGE_CHANNEL, 'handle', browser, [extensionChecker], async (args) => {
    const senderIdentifier = deriveSenderIdentifier(args.event);
    const envelope: RuntimeMessageEnvelope = {
      message: args.message,
      sender: { id: args.extensionId, context: args.senderContext },
    };
    browser.extensions.runtimeBus.send(args.extensionId, envelope, senderIdentifier);
  });

  //--------------------------------------------------------------------------------
  createHandler<{ responseKey: string; response: unknown }>(
    RUNTIME_SEND_RESPONSE_CHANNEL,
    'handle',
    browser,
    [],
    async () => {
      scopeLog.warn(
        '[extensions:runtime-send-response] received — MVP does not yet support sendResponse async routing',
      );
    },
  );
}

function deriveSenderIdentifier(
  event: IpcMainInvokeEvent | IpcMainServiceWorkerInvokeEvent,
): string {
  if ('serviceWorker' in event && event.serviceWorker) {
    return `sw:${event.serviceWorker.scriptURL}`;
  }
  const sender = (event as IpcMainInvokeEvent).sender;
  return `wc:${sender.id}`;
}

export function setupExtensionsServiceWorkerIPC(browser: Browser, ses: Session) {
  const registeredWorkers = new WeakSet<object>();
  const bus: RuntimeBus = browser.extensions.runtimeBus;

  const extensionIdFromWorker = (worker: { scriptURL: string }): TExtensionId | null => {
    const match = /^chrome-extension:\/\/([^/]+)\//.exec(worker.scriptURL);
    return match ? match[1] : null;
  };

  const registerForVersion = (versionId: number) => {
    const worker = ses.serviceWorkers.getWorkerFromVersionID(versionId);
    if (!worker) return;
    if (registeredWorkers.has(worker)) return;

    registeredWorkers.add(worker);
    const extensionId = extensionIdFromWorker(worker);
    if (extensionId) {
      bus.setServiceWorker(extensionId, worker);
    }

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

        const selectedTab = browser.selectedTab;
        if (!selectedTab) {
          scopeLog.warn('[extensions:crx-message] No selected tab');
          return;
        }

        return await browser.extensions.chrome.dispatch(
          win,
          selectedTab.tab.partition.id,
          extension.id,
          action.method,
          action.args,
        );
      },
    );

    worker.ipc.handle(
      RUNTIME_SEND_MESSAGE_CHANNEL,
      async (
        _event: IpcMainServiceWorkerInvokeEvent,
        rawArgs: {
          extensionId?: TExtensionId;
          message?: unknown;
          responseKey?: string;
          senderContext?: RuntimeContext;
        },
      ) => {
        if (!rawArgs.extensionId || !rawArgs.responseKey || !rawArgs.senderContext) {
          scopeLog.warn('[extensions:runtime-send-message] Invalid SW request', { rawArgs });
          return;
        }
        const expectedPrefix = `chrome-extension://${rawArgs.extensionId}/`;
        if (!worker.scriptURL.startsWith(expectedPrefix)) {
          scopeLog.warn(
            '[extensions:runtime-send-message] Service worker URL does not match extension ID',
            { expectedPrefix, actual: worker.scriptURL },
          );
          return;
        }
        const envelope: RuntimeMessageEnvelope = {
          message: rawArgs.message,
          sender: { id: rawArgs.extensionId, context: rawArgs.senderContext },
        };
        bus.send(rawArgs.extensionId, envelope, `sw:${worker.scriptURL}`);
      },
    );
  };

  ses.serviceWorkers.on('running-status-changed', (details) => {
    if (details.runningStatus === 'starting' || details.runningStatus === 'running') {
      // Attempt eager registration. During `starting`, `getWorkerFromVersionID`
      // may briefly return null before the worker object is published; poll a
      // few times with a small delay. `registeredWorkers` (WeakSet) dedupes
      // so the late `running` event is a safe no-op when `starting` won.
      const versionId = details.versionId;
      let attemptsLeft = 5;
      const tryRegister = () => {
        registerForVersion(versionId);
        const worker = ses.serviceWorkers.getWorkerFromVersionID(versionId);
        if (!worker || !registeredWorkers.has(worker)) {
          if (attemptsLeft > 0) {
            attemptsLeft -= 1;
            setTimeout(tryRegister, 20);
          }
        }
      };
      tryRegister();
      return;
    }
    if (details.runningStatus === 'stopped') {
      const worker = ses.serviceWorkers.getWorkerFromVersionID(details.versionId);
      const extId = worker ? extensionIdFromWorker(worker) : null;
      if (extId) bus.clearServiceWorker(extId);
    }
  });

  for (const versionId of Object.keys(ses.serviceWorkers.getAllRunning())) {
    registerForVersion(Number(versionId));
  }
}
