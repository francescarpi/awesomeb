import { TWindowId, INotification, TEntityType, IEntity } from '@shared/types';
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
    fetch: (winId: TWindowId, entity: TEntityType) => Promise<IEntity[]>;
  };

  const abCommands: {
    perform: (winId: TWindowId, trigger: string, params?: Record<string, unknown>) => void;
  };
}
