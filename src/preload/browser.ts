import {
  TWindowId,
  INotification,
  TEntityType,
  IDesktopEntity,
  TMenuType,
  TTabId,
  ITabContainer,
} from '~/types';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

//--------------------------------------------------------------------------------------
const abModal = {
  close: (winId: TWindowId) => {
    ipcRenderer.send('modal:close', winId);
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
  selectTab: (winId: TWindowId, tabId: TTabId) => {
    return ipcRenderer.invoke('tabs:select', winId, tabId);
  },
  onRefresh: (callback: (event: IpcRendererEvent, tabContainers: ITabContainer[]) => void) => {
    ipcRenderer.on('tabs:refresh', callback);
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
