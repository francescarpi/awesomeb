import { TWindowId, INotification } from '@shared/types';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const awesomeUI = {
  closeModal: (winId: TWindowId) => {
    ipcRenderer.send('ui:close-modal', winId);
  },
  onRefreshNotifications: (
    callback: (e: IpcRendererEvent, winId: TWindowId, notifications: INotification[]) => void,
  ) => {
    ipcRenderer.on('ui:refresh-notifications', callback);
  },
  nextNotification: (winId: TWindowId) => {
    ipcRenderer.send('ui:next-notification', winId);
  },
};

contextBridge.exposeInMainWorld('awesomeUI', awesomeUI);
