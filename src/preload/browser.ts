import { TWindowId, INotification, TListWithSearchEntity } from '@shared/types';
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

const abWindow = {
  close: (winId: TWindowId) => {
    ipcRenderer.send('window:close', winId);
  },
  minimize: (winId: TWindowId) => {
    ipcRenderer.send('window:minimize', winId);
  },
  maximize: (winId: TWindowId) => {
    ipcRenderer.send('window:maximize', winId);
  },
};

const abListWithSearch = {
  getEntities: async (winId: TWindowId, entity: TListWithSearchEntity) => {
    return await ipcRenderer.invoke('list-with-search:get-entities', winId, entity);
  },
};

contextBridge.exposeInMainWorld('abModal', abModal);
contextBridge.exposeInMainWorld('abNotifications', abNotifications);
contextBridge.exposeInMainWorld('abWindow', abWindow);
contextBridge.exposeInMainWorld('abListWithSearch', abListWithSearch);
