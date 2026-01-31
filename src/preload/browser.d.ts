import {
  TWindowId,
  INotification,
  TEntityType,
  IEntity,
  IDesktopEntity,
  TDesktopId,
  ITheme,
  TMenuType,
  ITabContainer,
  TTabId,
} from '~/types';
import { IpcRendererEvent } from 'electron';

export {};

declare global {
  //--------------------------------------------------------------------------------------
  const abModal: {
    close: (winId: TWindowId) => void;
  };

  //--------------------------------------------------------------------------------------
  const abNotifications: {
    onRefreshNotifications: (
      callback: (e: IpcRendererEvent, winId: TWindowId, notifications: INotification[]) => void,
    ) => void;
    nextNotification: (winId: TWindowId) => void;
  };

  //--------------------------------------------------------------------------------------
  const abEntities: {
    fetch: <T>(winId: TWindowId, entity: TEntityType) => Promise<T[]>;
  };

  //--------------------------------------------------------------------------------------
  const abCommands: {
    perform: (winId: TWindowId, trigger: string, params?: Record<string, unknown>) => Promise<void>;
  };

  //--------------------------------------------------------------------------------------
  const abDesktops: {
    onRefresh: (callback: (event: IpcRendererEvent, desktops: IDesktopEntity[]) => void) => void;
    select: (winId: TWindowId, desktopId: TDesktopId) => void;
    getTheme: (winId: TWindowId) => Promise<ITheme>;
    onThemeRefresh: (callback: (event: IpcRendererEvent, theme: ITheme) => void) => void;
  };

  //--------------------------------------------------------------------------------------
  const abWindow: {
    readyToShow: (winId: TWindowId) => void;
  };

  //--------------------------------------------------------------------------------------
  const abMenu: {
    contextMenu: (winId: TWindowId, type: TMenuType, params?: Record<string, unknown>) => void;
  };

  //--------------------------------------------------------------------------------------
  const abTabs: {
    getTabContainers: (winId: TWindowId) => Promise<ITabContainer[]>;
    selectTab: (winId: TWindowId, tabId: TTabId) => void;
    onRefresh: (
      callback: (event: IpcRendererEvent, tabContainers: ITabContainer[]) => void,
    ) => void;
  };

  //--------------------------------------------------------------------------------------
  const abView: {
    onChangeVisible: (callback: (event: IpcRendererEvent, visible: boolean) => void) => void;
  };
}
