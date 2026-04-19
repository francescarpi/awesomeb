import { contextBridge, ipcRenderer } from 'electron';

const extensionId = window.location.href.split('/')[2];

const searchParams = new URLSearchParams(window.location.search);
const winId = parseInt(searchParams.get('winId')!, 10);
const partitionId = searchParams.get('partitionId')!;

async function invokeRequest(method: string, ...args: unknown[]) {
  return await ipcRenderer.invoke('extension-crx-message', winId, partitionId, extensionId, {
    method,
    args,
  });
}

const electronContext = {
  invokeRequest,
};

function chromeAPI() {
  const chrome = globalThis.chrome;
  const electron = ((globalThis as any).electron as typeof electronContext) || electronContext;

  const chromeAPIS = {
    tabs: {
      query: async (info: chrome.tabs.QueryInfo, callback?: CallableFunction) => {
        const tabs = await electron.invokeRequest('tabs.query', info);
        if (callback) {
          callback(tabs);
        }
      },
      create: async (createProperties: chrome.tabs.CreateProperties) => {
        await electron.invokeRequest('tabs.create', createProperties);
      },
      update: async (tabId: number | undefined, updateProperties: chrome.tabs.UpdateProperties) => {
        await electron.invokeRequest('tabs.update', { tabId, ...updateProperties });
      },
      duplicate: async (tabId: number, callback?: (tab: chrome.tabs.Tab) => void) => {
        const tab = await electron.invokeRequest('tabs.duplicate', tabId);
        if (callback) {
          callback(tab);
        }
      },
      reload: async (tabData: number | undefined | chrome.tabs.ReloadProperties) => {
        await electron.invokeRequest('tabs.reload', { tabData });
      },
      cookies: {
        getAll: async (
          details: chrome.cookies.GetAllDetails,
          callback: (cookies: chrome.cookies.Cookie[]) => void,
        ) => {
          const cookies = await electron.invokeRequest('cookies.getAll', details);
          callback(cookies);
        },
      },
    },
    action: {
      setIcon: async (details: chrome.action.TabIconDetails, callback?: () => void) => {
        await electron.invokeRequest('action.setIcon', details);
        if (callback) {
          callback();
        }
      },
    },
  };

  for (const apiName in chromeAPIS) {
    Object.defineProperty(chrome, apiName, {
      value: {
        ...(chrome as any)[apiName],
        ...(chromeAPIS as any)[apiName],
      },
      enumerable: true,
      configurable: true,
    });
  }

  delete (globalThis as any).electron;

  Object.freeze(chrome);
}

// Expose some functions to the renderer process
contextBridge.exposeInMainWorld('electron', electronContext);

contextBridge.executeInMainWorld({ func: chromeAPI });

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  const clientRect = document.documentElement.getBoundingClientRect();
  const width = Math.ceil(clientRect.width);
  const height = Math.ceil(clientRect.height);
  ipcRenderer.send('extensions:ini-popup', winId, width, height);
});
