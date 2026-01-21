import { TWindowId, INotification } from '@shared/types';
import { IpcRendererEvent } from 'electron';

export {};

declare global {
  const awesomeUI: {
    closeModal: (winId: TWindowId) => void;
    onRefreshNotifications: (
      callback: (e: IpcRendererEvent, winId: TWindowId, notifications: INotification[]) => void,
    ) => void;
    nextNotification: (winId: TWindowId) => void;
  };
}
