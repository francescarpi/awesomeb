import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

if (window) {
  const searchParams = new URLSearchParams(window.location.search);

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
      document.addEventListener('DOMContentLoaded', () => {
        const clientRect = document.body.getBoundingClientRect();
        const width = Math.ceil(clientRect.width);
        const height = Math.ceil(clientRect.height);
        iniPopup(width, height);
      });

      // Chrome APIS
      const chrome = globalThis.chrome;
      const browser = globalThis.browser;
      if (!chrome || !browser) {
        console.error('Chrome API is not available in the extension context.');
        return;
      }

      const extensionId = chrome.runtime?.id;

      const apis = {
        tabs: {
          query: async (info: chrome.tabs.QueryInfo, callback?: CallableFunction) => {
            const tabs = await crxMessage(extensionId, 'tabs.query', info);
            if (callback) {
              callback(tabs);
            }
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
          cookies: {
            getAll: async (
              details: chrome.cookies.GetAllDetails,
              callback: (cookies: chrome.cookies.Cookie[]) => void,
            ) => {
              const cookies = await crxMessage<chrome.cookies.Cookie[]>(
                extensionId,
                'cookies.getAll',
                details,
              );
              callback(cookies);
            },
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
          onChanged: (
            callback: (id: string, changeInfo: { title: string; url?: string }) => void,
          ) => {
            crxEvent<{ id: string; changeInfo: { title: string; url?: string } }>(
              'bookmarks.onChanged',
              (_event, params) => {
                callback(params.id, params.changeInfo);
              },
            );
          },
          onMoved: (
            callback: (
              id: string,
              moveInfo: {
                parentId: string;
                index: number;
                oldParentId: string;
                oldIndex: number;
              },
            ) => void,
          ) => {
            crxEvent<{
              id: string;
              moveInfo: {
                parentId: string;
                index: number;
                oldParentId: string;
                oldIndex: number;
              };
            }>('bookmarks.onMoved', (_event, params) => {
              callback(params.id, params.moveInfo);
            });
          },
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

      for (const target of [chrome, browser]) {
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
      location.href.startsWith('chrome-extension://') ||
        location.href.includes('/extension-popup-failed?'),
      (width: number, height: number) => {
        return ipcRenderer.send('extensions:ini-popup', {
          winId: parseInt(searchParams.get('winId')!, 10),
          width,
          height,
        });
      },
      (extensionId: string, method: string, ...args: unknown[]) => {
        return ipcRenderer.invoke('extensions:crx-message', {
          winId: parseInt(searchParams.get('winId')!, 10),
          partitionId: searchParams.get('partitionId')!,
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
}
