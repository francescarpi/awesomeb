import { TWindowId, INotification, TEntityType, IEntity, IDesktopEntity } from '@shared/types';
import { IpcRendererEvent } from 'electron';

export {};

declare global {
  const abModal: {
    closeModal: (winId: TWindowId) => void;
  };

  const abNotifications: {
    onRefreshNotifications: (
      callback: (e: IpcRendererEvent, winId: TWindowId, notifications: INotification[]) => void,
    ) => void;
    nextNotification: (winId: TWindowId) => void;
  };

  const abEntities: {
    fetch: <T>(winId: TWindowId, entity: TEntityType) => Promise<T[]>;
  };

  const abCommands: {
    perform: (winId: TWindowId, trigger: string, params?: Record<string, unknown>) => void;
  };

  const abDesktops: {
    onRefresh: (callback: (event: IpcRendererEvent, desktops: IDesktopEntity[]) => void) => void;
  };
}
