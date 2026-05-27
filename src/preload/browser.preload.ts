import type {
  TWindowId,
  TEntityType,
  TMenuType,
  ITabContainer,
  IURLTabData,
  ITab,
  TPage,
  TTabId,
  TFindInPageAction,
  IFindInPageResult,
  IBookmark,
  ITabNavigation,
  IDownloads,
  ITabSwitcherTab,
  TMarksAction,
  IConfig,
  IContextualModalParams,
  TExtensionId,
  IExtension,
  TDesktopId,
  TTabPreviewAction,
  ILayoutData,
  IDesktop,
  TPermissions,
  TShortcutMapId,
  TShortcutId,
  IVisitHistoryResponse,
  TFindUrlResult,
  ITabMediaSessionInfo,
  TMediaSessionAction,
  IAbout,
} from '~/types';
import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

//--------------------------------------------------------------------------------------
const abModal = {
  close: (winId: TWindowId) => {
    ipcRenderer.send('modal:close', { winId });
  },
  open: (winId: TWindowId, page: TPage) => {
    ipcRenderer.send('modal:open', { winId, page });
  },
  openContextual: (winId: TWindowId, page: TPage, params: IContextualModalParams) => {
    ipcRenderer.send('modal:open-contextual', { winId, page, params });
  },
  closeContextual: (winId: TWindowId) => {
    ipcRenderer.send('modal:close-contextual', { winId });
  },
  resize: (winId: TWindowId, width: number, height: number) => {
    ipcRenderer.send('modal:resize', { winId, width, height });
  },
};

//--------------------------------------------------------------------------------------
const abEntities = {
  fetch: async (winId: TWindowId, entity: TEntityType) => {
    return await ipcRenderer.invoke('entities:fetch', { winId, entity });
  },
};

//--------------------------------------------------------------------------------------
const abCommands = {
  perform: async (winId: TWindowId, trigger: string, params?: Record<string, unknown>) => {
    await ipcRenderer.invoke('commands:perform', { winId, trigger, params });
  },
};

//--------------------------------------------------------------------------------------
const abDesktops = {
  onRefresh: (callback: (event: IpcRendererEvent, desktops: IDesktop[]) => void) => {
    ipcRenderer.on('desktops:refresh-visible', callback);
  },
  select: (winId: TWindowId, desktopId: string) => {
    ipcRenderer.send('desktops:select', { winId, desktopId });
  },
  getTheme: async (winId: TWindowId) => {
    return await ipcRenderer.invoke('desktops:get-theme', { winId });
  },
  onThemeRefresh: (callback: (event: IpcRendererEvent, theme: unknown) => void) => {
    ipcRenderer.on('desktop:theme-refresh', callback);
  },
  onRefreshSelected: (callback: (event: IpcRendererEvent, desktopId: TDesktopId) => void) => {
    ipcRenderer.on('desktops:refresh-selected', callback);
  },
  all: async (winId: TWindowId) => {
    return await ipcRenderer.invoke('desktops:all', { winId });
  },
};

//--------------------------------------------------------------------------------------
const abWindow = {
  readyToShow: (winId: TWindowId) => {
    ipcRenderer.send('window:ready-to-show', { winId });
  },
  onRefreshLayoutData: (callback: (event: IpcRendererEvent, data: ILayoutData) => void) => {
    ipcRenderer.on('window:refresh-layout-data', callback);
  },
  onRefreshMediaSession: (
    callback: (event: IpcRendererEvent, data: ITabMediaSessionInfo | null) => void,
  ) => {
    ipcRenderer.on('window:refresh-media-session', callback);
  },
  mediaSessionAction: (winId: TWindowId, tabId: TTabId, action: TMediaSessionAction) => {
    ipcRenderer.send('window:media-session-action', { winId, tabId, action });
  },
  getMediaSession: async (winId: TWindowId) => {
    return await ipcRenderer.invoke('window:get-media-session', { winId });
  },
};

//--------------------------------------------------------------------------------------
const abMenu = {
  contextMenu: (winId: TWindowId, type: TMenuType, params: Record<string, unknown>) => {
    ipcRenderer.send('menu:context-menu', { winId, type, params });
  },
};

//--------------------------------------------------------------------------------------
const abTabs = {
  getTabContainers: (winId: TWindowId) => {
    return ipcRenderer.invoke('tabs:get-tab-containers', { winId });
  },
  onRefreshTabContainers: (
    callback: (event: IpcRendererEvent, tabContainers: ITabContainer[]) => void,
  ) => {
    ipcRenderer.on('tabs:refresh', callback);
  },
  onRefreshOne: (callback: (event: IpcRendererEvent, tab: ITab) => void) => {
    ipcRenderer.on('tabs:refresh-one', callback);
  },
  closeFindInTab: (tabId: TTabId) => {
    ipcRenderer.send('tabs:close-find-in-tab', { tabId });
  },
  findInPageAction: (tabId: TTabId, action: TFindInPageAction, query: string) => {
    return ipcRenderer.invoke('tabs:find-in-page-action', { tabId, action, query });
  },
  onRefreshFindInPage: (
    callback: (event: IpcRendererEvent, result: IFindInPageResult | null) => void,
  ) => {
    ipcRenderer.on('tabs:refresh-find-in-page', callback);
  },
  retryFailed: (tabId: TTabId) => {
    ipcRenderer.send('tabs:retry-failed', { tabId });
  },
  login: (winId: TWindowId, tabId: TTabId, data: { username: string; password: string } | null) => {
    ipcRenderer.send('tabs:login', { winId, tabId, data });
  },
  clientCertificate: (winId: TWindowId, tabId: TTabId, fingeprint: string | null) => {
    ipcRenderer.send('tabs:client-certificate', { winId, tabId, fingeprint });
  },
  trustCertificateError: (tabId: TTabId) => {
    ipcRenderer.send('tabs:trust-certificate-error', { tabId });
  },
  grantPermission: (winId: TWindowId, tabId: TTabId, value: boolean) => {
    ipcRenderer.send('tabs:grant-permission', { winId, tabId, value });
  },
  tabPreviewAction: (tabId: TTabId, action: TTabPreviewAction) => {
    ipcRenderer.send('tabs:tab-preview-action', { tabId, action });
  },
  onRefreshShowSplitMenu: (callback: (event: IpcRendererEvent, value: boolean) => void) => {
    ipcRenderer.on('tab:has-split', callback);
  },
};

//--------------------------------------------------------------------------------------
const abUrlBar = {
  get: (winId: TWindowId) => {
    return ipcRenderer.invoke('urlbar:get', { winId });
  },
  onRefresh: (callback: (event: IpcRendererEvent, urlInfo: IURLTabData) => void) => {
    ipcRenderer.on('urlbar:refresh', callback);
  },
  onTabNavigationRefresh: (callback: (event: IpcRendererEvent, data: ITabNavigation) => void) => {
    ipcRenderer.on('urlbar:refresh-tab-navigation', callback);
  },
};

//--------------------------------------------------------------------------------------
const abBookmarks = {
  add: (
    winId: TWindowId,
    parentFolderId: string,
    title: string,
    url: string,
    newFolderName: string | null,
  ) => {
    ipcRenderer.send('bookmarks:add', { winId, parentFolderId, title, url, newFolderName });
  },
  get: async (): Promise<IBookmark[]> => {
    return await ipcRenderer.invoke('bookmarks:get');
  },
  update: async (bookmarksList: IBookmark[]) => {
    await ipcRenderer.invoke('bookmarks:update', { bookmarksList });
  },
};

//--------------------------------------------------------------------------------------
const abVisitHistory = {
  get: async (page?: number, query?: string): Promise<IVisitHistoryResponse> => {
    return await ipcRenderer.invoke('visit-history:get', { page, query });
  },
  deleteAll: async (): Promise<void> => {
    await ipcRenderer.invoke('visit-history:delete-all', {});
  },
  deleteUrls: async (urls: string[]): Promise<void> => {
    await ipcRenderer.invoke('visit-history:delete-urls', { urls });
  },
  autocompleteUrls: async (query: string): Promise<TFindUrlResult[]> => {
    return await ipcRenderer.invoke('visit-history:find', { query });
  },
};

//--------------------------------------------------------------------------------------
const abDownloads = {
  onRefresh: (callback: (event: IpcRendererEvent, data: IDownloads) => void) => {
    ipcRenderer.on('downloads:refresh', callback);
  },
  openPage: (winId: TWindowId) => {
    ipcRenderer.send('downloads:open-page', { winId });
  },
  action: (savePath: string, action: 'cancel' | 'pause' | 'resume' | 'open', winId?: TWindowId) => {
    ipcRenderer.send('downloads:action', { savePath, action, winId });
  },
  get: async (winId?: TWindowId) => {
    return await ipcRenderer.invoke('downloads:get', { winId });
  },
  clearCompleted: () => {
    ipcRenderer.send('downloads:clear-completed');
  },
};

//--------------------------------------------------------------------------------------
const abFavicons = {
  get: (winId: TWindowId, tabId: TTabId) => {
    return ipcRenderer.invoke('favicons:get', { winId, tabId });
  },
};

//--------------------------------------------------------------------------------------
const abTabSwitcher = {
  close: (winId: TWindowId) => {
    ipcRenderer.send('tabswitcher:close', { winId });
  },
  refresh: (callback: (event: IpcRendererEvent, tabs: ITabSwitcherTab[]) => void) => {
    ipcRenderer.on('tabswitcher:refresh', callback);
  },
  get: (winId: TWindowId) => {
    return ipcRenderer.invoke('tabswitcher:get', { winId });
  },
};

//--------------------------------------------------------------------------------------
const abTabMarks = {
  close: (winId: TWindowId) => {
    ipcRenderer.send('tabmarks:close', { winId });
  },
  get: (winId: TWindowId) => {
    return ipcRenderer.invoke('tabmarks:get', { winId });
  },
  perform: (winId: TWindowId, action: TMarksAction) => {
    return ipcRenderer.invoke('tabmarks:perform', { winId, action });
  },
  onChangeVisibility: (callback: (event: IpcRendererEvent, visible: boolean) => void) => {
    ipcRenderer.on('tabmarks:change-visibility', callback);
  },
};

//--------------------------------------------------------------------------------------
const abCertificates = {
  info: (winId: TWindowId) => {
    return ipcRenderer.invoke('certificates:info', { winId });
  },
};

//--------------------------------------------------------------------------------------
const abConfig = {
  get: (winId?: TWindowId) => {
    return ipcRenderer.invoke('config:get', { winId });
  },
  save: (config: IConfig) => {
    return ipcRenderer.invoke('config:save', { config });
  },
  selectDownloadFolder: () => {
    return ipcRenderer.invoke('config:select-download-folder', {});
  },
  refresh: (callback: (event: IpcRendererEvent, config: IConfig) => void) => {
    ipcRenderer.on('config:refresh', callback);
  },
};

//--------------------------------------------------------------------------------------
const abSidebar = {
  onChangeDrag: (callback: (event: IpcRendererEvent, isDragable: boolean) => void) => {
    ipcRenderer.on('sidebar:change-drag', callback);
  },
};

//--------------------------------------------------------------------------------------
const abExtensions = {
  get: (winId?: TWindowId) => {
    return ipcRenderer.invoke('extensions:get', { winId });
  },
  active: (winId?: TWindowId) => {
    return ipcRenderer.invoke('extensions:active', { winId });
  },
  refresh: () => {
    return ipcRenderer.invoke('extensions:refresh');
  },
  toggle: (id: TExtensionId) => {
    return ipcRenderer.invoke('extensions:toggle', { id });
  },
  onRefresh: (callback: (event: IpcRendererEvent, extensions: IExtension[]) => void) => {
    ipcRenderer.on('extensions:on-refresh', callback);
  },
  openPopup: (winId: TWindowId, extensionId: TExtensionId, x: number, y: number) => {
    ipcRenderer.send('extensions:open-popup', { winId, extensionId, x, y });
  },
  closePopup: (winId: TWindowId) => {
    ipcRenderer.send('extensions:close-popup', { winId });
  },
};

//--------------------------------------------------------------------------------------
const abPrompts = {
  response: (winId: TWindowId, response: unknown) => {
    ipcRenderer.send('prompts:response', { winId, response });
  },
};

//--------------------------------------------------------------------------------------
const abPermissions = {
  get: () => {
    return ipcRenderer.invoke('permissions:get', {});
  },
  save: (permissions: TPermissions) => {
    return ipcRenderer.invoke('permissions:save', { permissions });
  },
};

//--------------------------------------------------------------------------------------
const abShortcuts = {
  maps: () => {
    return ipcRenderer.invoke('shortcuts:maps', {});
  },
  override: (mapId: TShortcutMapId, shortcutId: TShortcutId, key: string) => {
    return ipcRenderer.invoke('shortcuts:override', { mapId, shortcutId, key });
  },
};

//--------------------------------------------------------------------------------------
const abDebug = {
  webContents: () => {
    return ipcRenderer.invoke('debug:webcontents', {});
  },
};

//--------------------------------------------------------------------------------------
const abBrowser = {
  about: (winId: TWindowId): Promise<IAbout> => {
    return ipcRenderer.invoke('about:get', { winId });
  },
};

//--------------------------------------------------------------------------------------
contextBridge.exposeInMainWorld('abModal', abModal);
contextBridge.exposeInMainWorld('abEntities', abEntities);
contextBridge.exposeInMainWorld('abCommands', abCommands);
contextBridge.exposeInMainWorld('abDesktops', abDesktops);
contextBridge.exposeInMainWorld('abWindow', abWindow);
contextBridge.exposeInMainWorld('abMenu', abMenu);
contextBridge.exposeInMainWorld('abTabs', abTabs);
contextBridge.exposeInMainWorld('abUrlBar', abUrlBar);
contextBridge.exposeInMainWorld('abBookmarks', abBookmarks);
contextBridge.exposeInMainWorld('abVisitHistory', abVisitHistory);
contextBridge.exposeInMainWorld('abDownloads', abDownloads);
contextBridge.exposeInMainWorld('abFavicons', abFavicons);
contextBridge.exposeInMainWorld('abTabSwitcher', abTabSwitcher);
contextBridge.exposeInMainWorld('abTabMarks', abTabMarks);
contextBridge.exposeInMainWorld('abCertificates', abCertificates);
contextBridge.exposeInMainWorld('abConfig', abConfig);
contextBridge.exposeInMainWorld('abSidebar', abSidebar);
contextBridge.exposeInMainWorld('abExtensions', abExtensions);
contextBridge.exposeInMainWorld('abPrompts', abPrompts);
contextBridge.exposeInMainWorld('abPermissions', abPermissions);
contextBridge.exposeInMainWorld('abShortcuts', abShortcuts);
contextBridge.exposeInMainWorld('abDebug', abDebug);
contextBridge.exposeInMainWorld('abBrowser', abBrowser);
