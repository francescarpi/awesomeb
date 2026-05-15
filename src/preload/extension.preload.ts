import { contextBridge, ipcRenderer } from 'electron';

const extensionId = window.location.href.split('/')[2];
const searchParams = new URLSearchParams(window.location.search);
const winId = parseInt(searchParams.get('winId')!, 10);
const partitionId = searchParams.get('partitionId')!;

contextBridge.executeInMainWorld({
  func: (
    iniPopup: (width: number, height: number) => void,
    crxMessage: <T>(method: string, ...args: unknown[]) => Promise<T>,
  ) => {
    // Ini extension popup
    document.addEventListener('DOMContentLoaded', () => {
      const clientRect = document.documentElement.getBoundingClientRect();
      const width = Math.ceil(clientRect.width);
      const height = Math.ceil(clientRect.height);
      iniPopup(width, height);
    });

    // Chrome APIS
    const chrome = globalThis.chrome;
    if (!chrome) {
      console.error('Chrome API is not available in the extension context.');
      return;
    }

    const apis = {
      tabs: {
        query: async (info: chrome.tabs.QueryInfo, callback?: CallableFunction) => {
          const tabs = await crxMessage('tabs.query', info);
          if (callback) {
            callback(tabs);
          }
        },
        create: async (createProperties: chrome.tabs.CreateProperties) => {
          await crxMessage('tabs.create', createProperties);
        },
        update: async (
          tabId: number | undefined,
          updateProperties: chrome.tabs.UpdateProperties,
        ) => {
          await crxMessage('tabs.update', { tabId, ...updateProperties });
        },
        duplicate: async (tabId: number, callback?: (tab: chrome.tabs.Tab) => void) => {
          const tab = await crxMessage<chrome.tabs.Tab>('tabs.duplicate', tabId);
          if (callback) {
            callback(tab);
          }
        },
        reload: async (tabData: number | undefined | chrome.tabs.ReloadProperties) => {
          await crxMessage('tabs.reload', { tabData });
        },
        cookies: {
          getAll: async (
            details: chrome.cookies.GetAllDetails,
            callback: (cookies: chrome.cookies.Cookie[]) => void,
          ) => {
            const cookies = await crxMessage<chrome.cookies.Cookie[]>('cookies.getAll', details);
            callback(cookies);
          },
        },
      },
      action: {
        setIcon: async (details: chrome.action.TabIconDetails, callback?: () => void) => {
          await crxMessage('action.setIcon', details);
          if (callback) {
            callback();
          }
        },
      },
      bookmarks: {
        getTree: async (callback?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
          const tree = await crxMessage<chrome.bookmarks.BookmarkTreeNode[]>('bookmarks.getTree');
          if (callback) callback(tree);
        },
        getSubTree: async (
          id: string,
          callback?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void,
        ) => {
          const tree = await crxMessage<chrome.bookmarks.BookmarkTreeNode[]>(
            'bookmarks.getSubTree',
            { id },
          );
          if (callback) callback(tree);
        },
        getChildren: async (
          id: string,
          callback?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void,
        ) => {
          const children = await crxMessage<chrome.bookmarks.BookmarkTreeNode[]>(
            'bookmarks.getChildren',
            { id },
          );
          if (callback) callback(children);
        },
        getRecent: async (
          numberOfItems: number,
          callback?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void,
        ) => {
          const items = await crxMessage<chrome.bookmarks.BookmarkTreeNode[]>(
            'bookmarks.getRecent',
            { numberOfItems },
          );
          if (callback) callback(items);
        },
        search: async (
          query: string,
          callback?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void,
        ) => {
          const results = await crxMessage<chrome.bookmarks.BookmarkTreeNode[]>(
            'bookmarks.search',
            { query },
          );
          if (callback) callback(results);
        },
        create: async (
          bookmark: chrome.bookmarks.CreateDetails,
          callback?: (result: chrome.bookmarks.BookmarkTreeNode) => void,
        ) => {
          const result = await crxMessage<chrome.bookmarks.BookmarkTreeNode>(
            'bookmarks.create',
            bookmark,
          );
          if (callback) callback(result);
        },
        move: async (
          id: string,
          destination: chrome.bookmarks.MoveDestination,
          callback?: (result: chrome.bookmarks.BookmarkTreeNode) => void,
        ) => {
          const result = await crxMessage<chrome.bookmarks.BookmarkTreeNode>('bookmarks.move', {
            id,
            destination,
          });
          if (callback) callback(result);
        },
        update: async (
          id: string,
          changes: chrome.bookmarks.UpdateChanges,
          callback?: (result: chrome.bookmarks.BookmarkTreeNode) => void,
        ) => {
          const result = await crxMessage<chrome.bookmarks.BookmarkTreeNode>('bookmarks.update', {
            id,
            changes,
          });
          if (callback) callback(result);
        },
        remove: async (id: string, callback?: () => void) => {
          await crxMessage('bookmarks.remove', { id });
          if (callback) callback();
        },
        removeTree: async (id: string, callback?: () => void) => {
          await crxMessage('bookmarks.removeTree', { id });
          if (callback) callback();
        },
      },
    };

    for (const apiName in apis) {
      Object.defineProperty(chrome, apiName, {
        value: {
          ...(chrome as any)[apiName],
          ...(apis as any)[apiName],
        },
        enumerable: true,
        configurable: true,
      });
    }

    Object.freeze(chrome);
  },
  args: [
    (width: number, height: number) =>
      ipcRenderer.send('extensions:ini-popup', { winId, width, height }),
    (method: string, ...args: unknown[]) =>
      ipcRenderer.invoke('extensions:crx-message', {
        winId,
        partitionId,
        extensionId,
        action: {
          method,
          args,
        },
      }),
  ],
});
