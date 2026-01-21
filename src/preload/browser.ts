import { TWindowId, INotification } from '@shared/types';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const abModal = {
  closeModal: (winId: TWindowId) => {
    ipcRenderer.send('ui:close-modal', winId);
  },
};

const abNotifications = {
  onRefreshNotifications: (
    callback: (e: IpcRendererEvent, winId: TWindowId, notifications: INotification[]) => void,
  ) => {
    ipcRenderer.on('ui:refresh-notifications', callback);
  },
  nextNotification: (winId: TWindowId) => {
    ipcRenderer.send('ui:next-notification', winId);
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

contextBridge.exposeInMainWorld('abModal', abModal);
contextBridge.exposeInMainWorld('abNotifications', abNotifications);
contextBridge.exposeInMainWorld('abWindow', abWindow);
