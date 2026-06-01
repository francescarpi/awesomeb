import type {
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
  IExtension,
  TExtensionId,
  TTabPreviewAction,
  ILayoutData,
  IDesktop,
  TPermissions,
  IShortcutMap,
  TShortcutMapId,
  TShortcutId,
  IHistoryItem,
  IVisitHistoryResponse,
  ITabMediaSessionInfo,
  TMediaSessionAction,
  IDebugWebContent,
  IAbout,
  IDebugTabIndex,
} from '~/types';
import { IpcRendererEvent } from 'electron';

export {};

declare global {
  //--------------------------------------------------------------------------------------
  const abModal: {
    close: (winId: TWindowId) => void;
    open: (winId: TWindowId, page: TPage) => void;
    openContextual: (winId: TWindowId, page: TPage, params: IContextualModalParams) => void;
    closeContextual: (winId: TWindowId) => void;
    resize: (winId: TWindowId, width: number, height: number) => void;
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
    onRefresh: (callback: (event: IpcRendererEvent, desktops: IDesktop[]) => void) => void;
    onRefreshSelected: (callback: (event: IpcRendererEvent, desktopId: TDesktopId) => void) => void;
    select: (winId: TWindowId, desktopId: TDesktopId) => void;
    getTheme: (winId: TWindowId) => Promise<ITheme>;
    onThemeRefresh: (callback: (event: IpcRendererEvent, theme: ITheme) => void) => void;
    all: (winId: TWindowId) => Promise<IDesktop[]>;
  };

  //--------------------------------------------------------------------------------------
  const abWindow: {
    readyToShow: (winId: TWindowId) => void;
    onRefreshLayoutData: (callback: (event: IpcRendererEvent, data: ILayoutData) => void) => void;
    onRefreshMediaSession: (
      callback: (event: IpcRendererEvent, data: ITabMediaSessionInfo | null) => void,
    ) => void;
    mediaSessionAction: (winId: TWindowId, tabId: TTabId, action: TMediaSessionAction) => void;
    getMediaSession: (winId) => Promise<ITabMediaSessionInfo | null>;
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
    tabPreviewAction: (parentTabId: TTabId, action: TTabPreviewAction) => void;
    onRefreshShowSplitMenu: (callback: (event: IpcRendererEvent, value: boolean) => void) => void;
  };

  //--------------------------------------------------------------------------------------
  const abUrlBar: {
    get: (winId: TWindowId) => Promise<IURLTabData | null>;
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
      newFolderName: string | null,
    ) => void;
    get: () => Promise<IBookmark[]>;
    update: (bookmarks: IBookmark[]) => Promise<void>;
  };

  //--------------------------------------------------------------------------------------
  const abVisitHistory: {
    get: (page?: number, query?: string) => Promise<IVisitHistoryResponse>;
    deleteAll: () => Promise<void>;
    deleteUrls: (urls: string[]) => Promise<void>;
    autocompleteUrls: (query: string) => Promise<TFindUrlResult[]>;
  };

  //--------------------------------------------------------------------------------------
  const abDownloads: {
    onRefresh: (callback: (event: IpcRendererEvent, data: IDownloads) => void) => void;
    openPage: (winId: TWindowId) => void;
    action: (
      savePath: string,
      action: 'cancel' | 'pause' | 'resume' | 'open',
      winId?: TWindowId,
    ) => void;
    get: (winId?: TWindowId) => Promise<IDownloads>;
    clearCompleted: () => void;
  };

  //--------------------------------------------------------------------------------------
  const abFavicons: {
    get: (winId: TWindowId, tabId: TTabId) => Promise<string | null>;
  };

  //--------------------------------------------------------------------------------------
  const abTabSwitcher: {
    close: (winId: TWindowId) => void;
    refresh: (callback: (event: IpcRendererEvent, tabs: ITabSwitcherTab[]) => void) => void;
    get: (winId: TWindowId) => Promise<ITabSwitcherTab[]>;
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
    get: (winId?: TWindowId) => Promise<IConfig>;
    save: (config: IConfig) => Promise<IConfig>;
    selectDownloadFolder: () => Promise<string | null>;
    refresh: (callback: (event: IpcRendererEvent, config: IConfig) => void) => void;
  };

  //--------------------------------------------------------------------------------------
  const abSidebar: {
    onChangeDrag: (callback: (event: IpcRendererEvent, isDragable: boolean) => void) => void;
  };

  //--------------------------------------------------------------------------------------
  const abExtensions: {
    get: (winId?: TWindowId) => Promise<IExtensions>;
    active: (winId?: TWindowId) => Promise<IExtensions>;
    refresh: () => Promise<IExtensions>;
    toggle: (id: TExtensionId) => Promise<IExtension[]>;
    onRefresh: (callback: (event: IpcRendererEvent, extensions: IExtension[]) => void) => void;
    openPopup: (winId: TWindowId, extensionId: TExtensionId, x: number, y: number) => Promise<void>;
    closePopup: (winId: TWindowId) => Promise<void>;
  };

  //--------------------------------------------------------------------------------------
  const abPrompts: {
    response: (winId: TWindowId, response: unknown) => void;
  };

  //--------------------------------------------------------------------------------------
  const abPermissions: {
    get: () => Promise<TPermissions>;
    save: (permissions: TPermissions) => Promise<void>;
  };

  //--------------------------------------------------------------------------------------
  const abShortcuts: {
    maps: () => Promise<Record<TShortcutMapId, IShortcutMap>>;
    override: (mapId: TShortcutMapId, shortcutId: TShortcutId, key: string) => Promise<void>;
  };

  //--------------------------------------------------------------------------------------
  const abDebug: {
    webContents: () => Promise<IDebugWebContent[]>;
    tabIndex: () => Promise<IDebugTabIndex[]>;
  };

  //--------------------------------------------------------------------------------------
  const abBrowser: {
    about: (winId: TWindowId) => Promise<IAbout>;
  };

  //--------------------------------------------------------------------------------------
  const abWelcome: {
    ready: () => void;
    addSearchEnginedAndInitiate: (name: string, url: string) => void;
  };
}
