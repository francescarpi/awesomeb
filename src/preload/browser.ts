import { TWindowId, INotification, TEntityType, IDesktopEntity } from '~/types';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const abModal = {
  closeModal: (winId: TWindowId) => {
    ipcRenderer.send('modal:close', winId);
  },
};

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

const abEntities = {
  fetch: async (winId: TWindowId, entity: TEntityType) => {
    return await ipcRenderer.invoke('entities:fetch', winId, entity);
  },
};

const abCommands = {
  perform: (winId: TWindowId, trigger: string, params?: Record<string, unknown>) => {
    ipcRenderer.send('commands:perform', winId, trigger, params);
  },
};

const abDesktops = {
  onRefresh: (callback: (event: IpcRendererEvent, desktops: IDesktopEntity[]) => void) => {
    ipcRenderer.on('desktops:refresh', callback);
  },
  select: (winId: TWindowId, desktopId: string) => {
    ipcRenderer.send('desktops:select', winId, desktopId);
  },
};

contextBridge.exposeInMainWorld('abModal', abModal);
contextBridge.exposeInMainWorld('abNotifications', abNotifications);
contextBridge.exposeInMainWorld('abEntities', abEntities);
contextBridge.exposeInMainWorld('abCommands', abCommands);
contextBridge.exposeInMainWorld('abDesktops', abDesktops);
