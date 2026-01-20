import { TWindowId } from '@shared/types';
import { contextBridge, ipcRenderer } from 'electron';

const awesomeAPI = {
  closeModal: (winId: TWindowId) => {
    ipcRenderer.send('layout-system:close-modal', winId);
  },
};

contextBridge.exposeInMainWorld('awesome', awesomeAPI);
