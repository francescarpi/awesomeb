import {
  TWindowId,
  INotification,
  TEntityType,
  IDesktopEntity,
  TMenuType,
  ITabContainer,
  IURLTabData,
  ITab,
  TPage,
  TTabId,
  TFindInPageAction,
  IFindInPageResult,
  IBookmark,
  ITabNavigation,
} from '~/types';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

//--------------------------------------------------------------------------------------
const abModal = {
  close: (winId: TWindowId) => {
    ipcRenderer.send('modal:close', winId);
  },
  open: (winId: TWindowId, page: TPage) => {
    ipcRenderer.send('modal:open', winId, page);
  },
};

//--------------------------------------------------------------------------------------
const abNotifications = {
  onRefreshNotifications: (
    callback: (e: IpcRendererEvent, winId: TWindowId, notifications: INotification[]) => void,
  ) => {
    ipcRenderer.on('notifications:on-refresh', callback);
  },
  nextNotification: (winId: TWindowId) => {
    ipcRenderer.send('notifications:next', winId);
  },
};

//--------------------------------------------------------------------------------------
const abEntities = {
  fetch: async (winId: TWindowId, entity: TEntityType) => {
    return await ipcRenderer.invoke('entities:fetch', winId, entity);
  },
};

//--------------------------------------------------------------------------------------
const abCommands = {
  perform: async (winId: TWindowId, trigger: string, params?: Record<string, unknown>) => {
    await ipcRenderer.invoke('commands:perform', winId, trigger, params);
  },
};

//--------------------------------------------------------------------------------------
const abDesktops = {
  onRefresh: (callback: (event: IpcRendererEvent, desktops: IDesktopEntity[]) => void) => {
    ipcRenderer.on('desktops:refresh', callback);
  },
  select: (winId: TWindowId, desktopId: string) => {
    ipcRenderer.send('desktops:select', winId, desktopId);
  },
  getTheme: async (winId: TWindowId) => {
    return await ipcRenderer.invoke('desktops:get-theme', winId);
  },
  onThemeRefresh: (callback: (event: IpcRendererEvent, theme: unknown) => void) => {
    ipcRenderer.on('desktop:theme-refresh', callback);
  },
};

//--------------------------------------------------------------------------------------
const abWindow = {
  readyToShow: (winId: TWindowId) => {
    ipcRenderer.send('window:ready-to-show', winId);
  },
};

//--------------------------------------------------------------------------------------
const abMenu = {
  contextMenu: (winId: TWindowId, type: TMenuType, params: Record<string, unknown>) => {
    ipcRenderer.send('menu:context-menu', winId, type, params);
  },
};

//--------------------------------------------------------------------------------------
const abTabs = {
  getTabContainers: (winId: TWindowId) => {
    return ipcRenderer.invoke('tabs:get-tab-containers', winId);
  },
  onRefreshTabContainers: (
    callback: (event: IpcRendererEvent, tabContainers: ITabContainer[]) => void,
  ) => {
    ipcRenderer.on('tabs:refresh', callback);
  },
  onRefreshOne: (callback: (event: IpcRendererEvent, tab: ITab) => void) => {
    ipcRenderer.on('tabs:refresh-one', callback);
  },
  closeFindInTab: (tabId: TTabId) => {
    ipcRenderer.send('tabs:close-find-in-tab', tabId);
  },
  findInPageAction: (tabId: TTabId, action: TFindInPageAction, query: string) => {
    return ipcRenderer.invoke('tabs:find-in-page-action', tabId, action, query);
  },
  onRefreshFindInPage: (
    callback: (event: IpcRendererEvent, result: IFindInPageResult | null) => void,
  ) => {
    ipcRenderer.on('tabs:refresh-find-in-page', callback);
  },
  retryFailed: (tabId: TTabId) => {
    ipcRenderer.send('tabs:retry-failed', tabId);
  },
};

//--------------------------------------------------------------------------------------
const abUrlBar = {
  onRefresh: (callback: (event: IpcRendererEvent, urlInfo: IURLTabData) => void) => {
    ipcRenderer.on('urlbar:refresh', callback);
  },
  onTabNavigationRefresh: (callback: (event: IpcRendererEvent, data: ITabNavigation) => void) => {
    ipcRenderer.on('urlbar:refresh-tab-navigation', callback);
  },
};

//--------------------------------------------------------------------------------------
const abBookmarks = {
  add: (
    winId: TWindowId,
    parentFolderId: string,
    title: string,
    url: string,
    newFolderName: string,
  ) => {
    ipcRenderer.send('bookmarks:add', winId, parentFolderId, title, url, newFolderName);
  },
  get: async (): Promise<IBookmark[]> => {
    return await ipcRenderer.invoke('bookmarks:get');
  },
  update: async (bookmarks: IBookmark[]) => {
    await ipcRenderer.invoke('bookmarks:update', bookmarks);
  },
};

//--------------------------------------------------------------------------------------
contextBridge.exposeInMainWorld('abModal', abModal);
contextBridge.exposeInMainWorld('abNotifications', abNotifications);
contextBridge.exposeInMainWorld('abEntities', abEntities);
contextBridge.exposeInMainWorld('abCommands', abCommands);
contextBridge.exposeInMainWorld('abDesktops', abDesktops);
contextBridge.exposeInMainWorld('abWindow', abWindow);
contextBridge.exposeInMainWorld('abMenu', abMenu);
contextBridge.exposeInMainWorld('abTabs', abTabs);
contextBridge.exposeInMainWorld('abUrlBar', abUrlBar);
contextBridge.exposeInMainWorld('abBookmarks', abBookmarks);
