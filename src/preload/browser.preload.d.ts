import {
  TWindowId,
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
  IDownloads,
  ITabMark,
  TMarksAction,
  IConfig,
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
    onRefreshNoTabsInfo: (
      callback: (
        event: IpcRendererEvent,
        sidebarCollapsed: boolean,
        areaMaximized: boolean,
      ) => void,
    ) => void;
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
    retryFailed: (tabId: TTabId) => void;
    login: (
      winId: TWindowId,
      tabId: TTabId,
      data: { username: string; password: string } | null,
    ) => void;
    clientCertificate: (winId: TWindowId, tabId: TTabId, fingeprint: string | null) => void;
    trustCertificateError: (tabId: TTabId) => void;
    grantPermission: (winId: TWindowId, tabId: TTabId, value: boolean) => void;
    tabPreviewAction: (parentTabId: TTabId, action: 'close' | 'accept') => void;
  };

  //--------------------------------------------------------------------------------------
  const abUrlBar: {
    onRefresh: (callback: (event: IpcRendererEvent, urlInfo: IURLTabData) => void) => void;
    onTabNavigationRefresh: (
      callback: (event: IpcRendererEvent, data: ITabNavigation) => void,
    ) => void;
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
    get: () => Promise<IBookmark[]>;
    update: (bookmarks: IBookmark[]) => Promise<void>;
  };

  //--------------------------------------------------------------------------------------
  const abOpenURLHistory: {
    find: (winId: TWindowId, query: string) => Promise<TFindUrlResult>;
  };

  //--------------------------------------------------------------------------------------
  const abDownloads: {
    onRefresh: (callback: (event: IpcRendererEvent, data: IDownloads) => void) => void;
    openPage: (winId: TWindowId) => void;
    action: (savePath: string, action: 'cancel' | 'pause' | 'resume' | 'open') => void;
    get: () => Promise<IDownloads>;
  };

  //--------------------------------------------------------------------------------------
  const abFavicons: {
    get: (winId: TWindowId, tabId: TTabId) => Promise<string | null>;
  };

  //--------------------------------------------------------------------------------------
  const abTabSwitcher: {
    close: (winId: TWindowId) => void;
    refresh: (callback: (event: IpcRendererEvent, tabs: ITabSwitcherTab[]) => void) => void;
  };

  //--------------------------------------------------------------------------------------
  const abTabMarks: {
    close: (winId: TWindowId) => void;
    get: (winId: TWindowId) => Promise<ITabMark[]>;
    perform: (winId: TWindowId, action: TMarksAction) => Promise<ITabMark[]>;
    onChangeVisibility: (callback: (event: IpcRendererEvent, visible: boolean) => void) => void;
  };

  //--------------------------------------------------------------------------------------
  const abCertificates: {
    info: (winId: TWindowId) => Promise<IPeerCertificate>;
  };

  //--------------------------------------------------------------------------------------
  const abConfig: {
    get: (winId: TWindowId) => Promise<IConfig>;
  };
}
