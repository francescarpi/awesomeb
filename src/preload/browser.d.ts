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
  ITab,
  TPage,
} from '~/types';
import { IpcRendererEvent } from 'electron';

export {};

declare global {
  //--------------------------------------------------------------------------------------
  const abModal: {
    close: (winId: TWindowId) => void;
    open: (winId: TWindowId, page: TPage) => void;
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
    onRefreshTabContainers: (
      callback: (event: IpcRendererEvent, tabContainers: ITabContainer[]) => void,
    ) => void;
    onRefreshOne: (callback: (event: IpcRendererEvent, tab: ITab) => void) => void;
    closeFindInTab: (tabId: TTabId) => void;
    findInPageAction: (tabId: TTabId, action: TFindInPageAction, query: string) => void;
    onRefreshFindInPage: (
      callback: (event: IpcRendererEvent, result: IFindInPageResult | null) => void,
    ) => void;
  };

  //--------------------------------------------------------------------------------------
  const abUrlBar: {
    onRefresh: (callback: (event: IpcRendererEvent, urlInfo: IURLTabData) => void) => void;
  };

  //--------------------------------------------------------------------------------------
  const abBookmarks: {
    add: (
      winId: TWindowId,
      parentFolderId: string,
      title: string,
      url: string,
      newFolderName: string,
    ) => void;
  };
}
