import {
  TWindowId,
  INotification,
  TListWithSearchEntity,
  IListWithSearchEntity,
} from '@shared/types';
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

  const abListWithSearch: {
    getEntities: (
      winId: TWindowId,
      entity: TListWithSearchEntity,
    ) => Promise<IListWithSearchEntity[]>;
  };

  const abCommands: {
    perform: (winId: TWindowId, trigger: string, params?: Record<string, unknown>) => void;
  };
}
