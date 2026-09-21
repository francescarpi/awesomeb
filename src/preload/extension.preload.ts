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
  ],
});
