import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

type ExtensionTarget =
  NonNullable<typeof globalThis.chrome> | NonNullable<typeof globalThis.browser>;

contextBridge.executeInMainWorld({
  func: (
    isExtension: boolean,
    iniPopup: (width: number, height: number) => void,
    crxMessage: <T>(extensionId: string, method: string, ...args: unknown[]) => Promise<T>,
    crxEvent: <T>(
      eventName: string,
      callback: (event: IpcRendererEvent, params: T) => void,
    ) => void,
    crxRuntimeSendMessage: (
      targetExtensionId: string | undefined,
      message: unknown,
      senderContext: 'background' | 'popup' | 'content-script',
      responseCallback?: (response: unknown) => void,
    ) => Promise<unknown>,
  ) => {
    if (!isExtension) {
      return;
    }

    // Ini extension popup
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', async () => {
        const elements = [document.documentElement, document.body].filter(
          (element): element is HTMLElement => element !== null,
        );
        const width = Math.ceil(
          Math.max(...elements.flatMap((element) => [element.scrollWidth, element.offsetWidth])),
        );
        const height = Math.ceil(
          Math.max(...elements.flatMap((element) => [element.scrollHeight, element.offsetHeight])),
        );
        iniPopup(width, height);
      });
    }

    // Chrome APIS
    const targets: ExtensionTarget[] = [];
    const chrome = globalThis.chrome;
    const browser = globalThis.browser;

    if (chrome) targets.push(chrome);
    if (browser) targets.push(browser);

    if (targets.length === 0) {
      console.error('Chrome API is not available in the extension context.');
      return;
    }

    const extensionId = chrome.runtime?.id;

    /**
     * Returns a Chrome-API-compatible Event object stub. `addListener` registers the
     * callback via the existing `extensions:crx-event:${eventName}` IPC channel so
     * that future event delivery from main will reach existing listeners without
     * requiring a preload re-register. `removeListener`, `hasListener`, and
     * `hasListeners` are no-ops — extension reload clears listeners and main never
     * queries listener presence today.
     */
    function createChromeEventApi(eventName: string) {
      return {
        addListener(cb: (...args: unknown[]) => void) {
          crxEvent(eventName, (_e: unknown, params: unknown) => {
            if (params && typeof params === 'object') {
              cb(...Object.values(params as Record<string, unknown>));
            } else {
              cb();
            }
          });
        },
        removeListener(_cb: (...args: unknown[]) => void) {
          /* no-op: extension reload clears listeners */
        },
        hasListener(_cb: (...args: unknown[]) => void) {
          return false;
        },
        hasListeners() {
          return false;
        },
      };
    }

    const apis = {
      tabs: {
        query: async (info: chrome.tabs.QueryInfo, callback?: CallableFunction) => {
          const tabs = await crxMessage(extensionId, 'tabs.query', info);
          if (callback) {
            callback(tabs);
          }
          return tabs;
        },
        create: async (createProperties: chrome.tabs.CreateProperties) => {
          await crxMessage(extensionId, 'tabs.create', createProperties);
        },
        update: async (
          tabId: number | undefined,
          updateProperties: chrome.tabs.UpdateProperties,
        ) => {
          await crxMessage(extensionId, 'tabs.update', { tabId, ...updateProperties });
        },
        duplicate: async (tabId: number, callback?: (tab: chrome.tabs.Tab) => void) => {
          const tab = await crxMessage<chrome.tabs.Tab>(extensionId, 'tabs.duplicate', tabId);
          if (callback) {
            callback(tab);
          }
        },
        reload: async (tabData: number | undefined | chrome.tabs.ReloadProperties) => {
          await crxMessage(extensionId, 'tabs.reload', { tabData });
        },
        onCreated: createChromeEventApi('tabs.onCreated'),
        onUpdated: createChromeEventApi('tabs.onUpdated'),
        onRemoved: createChromeEventApi('tabs.onRemoved'),
        onMoved: createChromeEventApi('tabs.onMoved'),
        onDetached: createChromeEventApi('tabs.onDetached'),
        onAttached: createChromeEventApi('tabs.onAttached'),
        onActivated: createChromeEventApi('tabs.onActivated'),
        onHighlighted: createChromeEventApi('tabs.onHighlighted'),
        onReplaced: createChromeEventApi('tabs.onReplaced'),
        onZoomChange: createChromeEventApi('tabs.onZoomChange'),
      },
      cookies: {
        getAll: async (
          details: chrome.cookies.GetAllDetails,
          callback?: (cookies: chrome.cookies.Cookie[]) => void,
        ) => {
          const cookies = await crxMessage<chrome.cookies.Cookie[]>(
            extensionId,
            'cookies.getAll',
            details,
          );
          if (callback) {
            callback(cookies);
          }
          return cookies;
        },
      },
      action: {
        setIcon: async (details: chrome.action.TabIconDetails, callback?: () => void) => {
          await crxMessage(extensionId, 'action.setIcon', details);
          if (callback) {
            callback();
          }
        },
      },
      bookmarks: {
        getTree: async () => {
          return await crxMessage<chrome.bookmarks.BookmarkTreeNode[]>(
            extensionId,
            'bookmarks.getTree',
          );
        },
        get: async (
          idOrIdList: string | [string, ...string[]],
        ): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
          return await crxMessage<chrome.bookmarks.BookmarkTreeNode[]>(
            extensionId,
            'bookmarks.get',
            idOrIdList,
          );
        },
        onChanged: createChromeEventApi('bookmarks.onChanged'),
        onCreated: createChromeEventApi('bookmarks.onCreated'),
        onRemoved: createChromeEventApi('bookmarks.onRemoved'),
        onMoved: createChromeEventApi('bookmarks.onMoved'),
        onChildrenReordered: createChromeEventApi('bookmarks.onChildrenReordered'),
        onImportBegan: createChromeEventApi('bookmarks.onImportBegan'),
        onImportEnded: createChromeEventApi('bookmarks.onImportEnded'),
      },
      permissions: {
        contains: async (
          permissions: chrome.permissions.Permissions,
          callback?: (result: boolean) => void,
        ) => {
          const result = await crxMessage<boolean>(extensionId, 'permissions.contains', {
            permissions,
          });
          if (callback) {
            callback(result);
          }
          return result;
        },
        request: async (
          permissions: chrome.permissions.Permissions,
          callback?: (granted: boolean) => void,
        ) => {
          const result = await crxMessage<boolean>(extensionId, 'permissions.request', {
            permissions,
          });
          if (callback) {
            callback(result);
          }
          return result;
        },
        remove: async (
          permissions: chrome.permissions.Permissions,
          callback?: (removed: boolean) => void,
        ) => {
          const result = await crxMessage<boolean>(extensionId, 'permissions.remove', {
            permissions,
          });
          if (callback) {
            callback(result);
          }
          return result;
        },
      },
      tabGroups: {
        query: async (_options: unknown) => [],
        get: async (_groupId: number) => null,
        move: async (_groupId: number, _moveProperties: unknown) => {},
        update: async (_groupId: number, _updateProperties: unknown) => {},
        onCreated: createChromeEventApi('tabGroups.onCreated'),
        onMoved: createChromeEventApi('tabGroups.onMoved'),
        onRemoved: createChromeEventApi('tabGroups.onRemoved'),
        onUpdated: createChromeEventApi('tabGroups.onUpdated'),
      },
      history: {
        search: async (_query: unknown) => [],
        getVisits: async (_url: string) => [],
        onVisited: createChromeEventApi('history.onVisited'),
        onVisitRemoved: createChromeEventApi('history.onVisitRemoved'),
      },
      alarms: {
        get: async (_name?: string) => null,
        getAll: async () => [],
        clear: async (_name: string) => true,
        create: async (_name: string, _alarmInfo: unknown) => {},
        onAlarm: createChromeEventApi('alarms.onAlarm'),
      },
      runtime: {
        onStartup: createChromeEventApi('runtime.onStartup'),
        onInstalled: createChromeEventApi('runtime.onInstalled'),
        onSuspend: createChromeEventApi('runtime.onSuspend'),
        onSuspendCanceled: createChromeEventApi('runtime.onSuspendCanceled'),
        onUpdateAvailable: createChromeEventApi('runtime.onUpdateAvailable'),
        onConnect: createChromeEventApi('runtime.onConnect'),
        onConnectExternal: createChromeEventApi('runtime.onConnectExternal'),
        onMessageExternal: createChromeEventApi('runtime.onMessageExternal'),
        onRestartRequired: createChromeEventApi('runtime.onRestartRequired'),
        sendMessage: (
          extensionIdOrMsg: string | unknown,
          messageOrCb?: unknown,
          cbOrOptions?: unknown,
          maybeCallback?: unknown,
        ) => {
          let targetExtensionId: string | undefined;
          let message: unknown;
          let responseCallback: ((response: unknown) => void) | undefined;

          if (typeof extensionIdOrMsg === 'string') {
            targetExtensionId = extensionIdOrMsg;
            message = messageOrCb;
            if (typeof cbOrOptions === 'function') {
              responseCallback = cbOrOptions as (response: unknown) => void;
            } else if (typeof maybeCallback === 'function') {
              responseCallback = maybeCallback as (response: unknown) => void;
            }
          } else {
            message = extensionIdOrMsg;
            if (typeof messageOrCb === 'function') {
              responseCallback = messageOrCb as (response: unknown) => void;
            }
          }

          const senderContext: 'background' | 'popup' | 'content-script' =
            process.type === 'service-worker' ? 'background' : 'popup';

          return crxRuntimeSendMessage(targetExtensionId, message, senderContext, responseCallback);
        },
        onMessage: {
          addListener(
            cb: (
              message: unknown,
              sender: { id: string },
              sendResponse: (response: unknown) => void,
            ) => void,
          ) {
            crxEvent<{
              message: unknown;
              sender: { id: string };
              senderContext: string;
            }>('runtime.onMessage', (_e, params) => {
              // TODO: wire async sendResponse routing via `extensions:runtime-send-response`
              // in a follow-up — Floccus does not use sendResponse today.
              const sendResponse = (_response: unknown): void => {
                console.warn(
                  '[awesomeb] runtime.sendResponse not yet supported — wire this in a follow-up',
                );
              };
              cb(params?.message, params?.sender ?? { id: extensionId ?? '' }, sendResponse);
            });
          },
          removeListener(_cb: (...args: unknown[]) => void) {
            /* no-op: extension reload clears listeners */
          },
          hasListener(_cb: (...args: unknown[]) => void) {
            return false;
          },
          hasListeners() {
            return false;
          },
        },
      },
      storage: {
        local: {
          get: async (_keys: unknown) => ({}),
          set: async (_items: unknown) => {},
          remove: async (_keys: unknown) => {},
          clear: async () => {},
          getKeys: async () => [],
          getBytesInUse: async (_keys?: unknown) => 0,
        },
        sync: {
          get: async (_keys: unknown) => ({}),
          set: async (_items: unknown) => {},
          remove: async (_keys: unknown) => {},
          clear: async () => {},
          getKeys: async () => [],
          getBytesInUse: async (_keys?: unknown) => 0,
        },
        managed: {
          get: async (_keys: unknown) => ({}),
          getKeys: async () => [],
          getBytesInUse: async (_keys?: unknown) => 0,
        },
        onChanged: createChromeEventApi('storage.onChanged'),
      },
    };

    for (const target of targets) {
      for (const [key, methods] of Object.entries(apis)) {
        Object.defineProperty(target, key, {
          value: { ...target[key], ...methods },
          enumerable: true,
          configurable: true,
        });
      }
    }
  },
  args: [
    process.type === 'service-worker' ||
      location.href.startsWith('chrome-extension://') ||
      location.href.includes('/extension-popup-failed?'),
    (width: number, height: number) => {
      return ipcRenderer.send('extensions:ini-popup', {
        width,
        height,
      });
    },
    (extensionId: string, method: string, ...args: unknown[]) => {
      return ipcRenderer.invoke('extensions:crx-message', {
        extensionId,
        action: {
          method,
          args,
        },
      });
    },
    (eventName: string, callback: (event: IpcRendererEvent, params: unknown) => void) => {
      ipcRenderer.on(`extensions:crx-event:${eventName}`, callback);
    },
    (
      targetExtensionId: string | undefined,
      message: unknown,
      senderContext: 'background' | 'popup' | 'content-script',
      responseCallback?: (response: unknown) => void,
    ): Promise<unknown> => {
      const responseKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const extId = targetExtensionId || globalThis.chrome?.runtime?.id;

      const responsePromise = new Promise<unknown>((resolve) => {
        ipcRenderer.once(
          `extensions:crx-runtime-response:${responseKey}`,
          (_event: unknown, response: unknown) => {
            resolve(response);
          },
        );
      });

      const invokePromise = ipcRenderer
        .invoke('extensions:runtime-send-message', {
          extensionId: extId,
          message,
          responseKey,
          senderContext,
        })
        .catch((err: unknown) => {
          console.warn('[awesomeb] runtime.sendMessage failed:', err);
          return undefined;
        });

      const settled = Promise.race<unknown>([responsePromise, invokePromise]).then((value) => {
        if (responseCallback) responseCallback(value);
        return value;
      });

      return settled;
    },
  ],
});
