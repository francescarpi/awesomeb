import type {
  IEntity,
  IDesktopEntity,
  IThemeEntity,
  IPartitionEntity,
  ITabContainer,
  IURLTabData,
  ITab,
  ITabEntity,
  TFindInPageId,
  IFindInPageResult,
  ITabContainerEntity,
  IBookmarkEntity,
  IBookmark,
  ITabNavigation,
  IDownloads,
  ITabSwitcherTab,
  IExtensions,
  IDesktop,
  IDebugWebContent,
  TWindowId,
  IAbout,
  IDebugTabIndex,
} from '~/types';
import { EDownloadStatus } from '~/types';
import {
  Browser,
  config,
  Desktop,
  getCommands,
  getThemes,
  Tab,
  TabContainer,
  Window,
  bookmarks,
  partitions,
  Layouts,
} from '@/core';
import dayjs from 'dayjs';
import { extensionsPath } from '@/paths';
import { type WebContentsView, type WebContents, app } from 'electron';
import { webContentsMemoryAndCPU, getPartitionInfo } from './helpers';

export class BrowserRenderer {
  constructor(private readonly _browser: Browser) {}

  commandsEntities(): IEntity[] {
    return getCommands(this._browser).map((cmd) => ({
      id: cmd.trigger,
      label: cmd.name,
      extra: cmd.description,
    }));
  }

  desktopsEntities(window: Window): IDesktopEntity[] {
    return window.desktops.map((desk) => ({
      id: desk.id.toString(),
      label: desk.label,
      selected: desk.id === window.selectedDesktop.id,
      requireAttention: desk.requireAttention,
      hasTabs: desk.hasTabs,
      hasActiveTabs: desk.hasActiveTabs,
      name: desk.name,
    }));
  }

  themesEntities(window: Window): IThemeEntity[] {
    const themes = getThemes();

    const selectedDesktop = window.selectedDesktop;
    const result: IThemeEntity[] = [];

    for (const [name, theme] of themes.entries()) {
      result.push({
        id: name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        selected: selectedDesktop.theme?.name === name,
        primary: theme.primary,
        secondary: theme.secondary,
        degrees: theme.degrees,
      });
    }

    return result;
  }

  searchEnginesEntities(): IEntity[] {
    const searchEngines = config.getProperty('searchEngines');

    return searchEngines.map((engine) => ({
      id: engine.code,
      label: engine.label,
    }));
  }

  partitionsEntities(): IPartitionEntity[] {
    const selectedTabResult = this._browser.selectedTab;
    return partitions.all.map((partition) => ({
      id: partition.id,
      label: partition.name,
      color: partition.color,
      selected: selectedTabResult?.tab.partition.id === partition.id,
    }));
  }

  targetsEntities(window: Window, props?: { onlyNewWindow?: boolean }): IEntity[] {
    const onlyNewWindow = props?.onlyNewWindow ?? false;

    const newWindowOption = [
      {
        id: 'new-window',
        label: 'New window',
      },
      {
        id: 'new-window-left',
        label: 'New left window',
      },
      {
        id: 'new-window-right',
        label: 'New right window',
      },
    ];

    if (onlyNewWindow) {
      return newWindowOption;
    }

    const result = [
      {
        id: 'current-desktop-window',
        label: 'New tab',
      },
      {
        id: 'after-current',
        label: 'New following tab',
      },
      {
        id: 'split-tab',
        label: 'Split into selected tab',
      },
      ...newWindowOption,
    ];

    for (const win of this._browser.windows) {
      result.push({
        id: `window-${win.id}`,
        label: `Window ${win.id}`,
      });
    }

    for (const desk of window.desktops) {
      result.push({
        id: `desktop-${desk.id}`,
        label: `Desktop: "${desk.label}"`,
      });
    }

    return result;
  }

  tabContainers(window: Window): ITabContainer[] {
    const tabContainers: ITabContainer[] = [];

    for (const desktop of window.desktops) {
      let shortcutCounter = 0;
      const selectedTabContainer = desktop.selectedTabContainer;
      for (const tc of desktop.tabContainers) {
        let shortcut: number | null = null;
        if (shortcutCounter < 9 && !tc.isClosed) {
          shortcutCounter++;
          shortcut = shortcutCounter;
        }

        tabContainers.push({
          id: tc.id,
          shortcut,
          desktopId: desktop.id,
          selected: selectedTabContainer?.id === tc.id,
          divider: tc.divider,
          isClosed: tc.isClosed,
          tabs: tc.tabs.map((tab) => this.tab(window, desktop, selectedTabContainer, tab)),
          isSplit: tc.isSplit,
        });
      }
    }
    return tabContainers;
  }

  tab(window: Window, desktop: Desktop, selectedTabContainer: TabContainer | null, tab: Tab): ITab {
    return {
      id: tab.id,
      desktopId: desktop.id,
      windowId: window.id,
      title: tab.title,
      url: tab.url,
      selected: selectedTabContainer?.selectedTab?.id === tab.id,
      partition: {
        name: tab.partition.name,
        color: tab.partition.color,
        private: tab.partition.private,
      },
      suspended: tab.suspended,
      loading: tab.loading,
      hasTabPreview: tab.hasTabPreview,
      requireAttention: tab.requireAttention,
      isMuted: tab.isMuted,
      favicon: tab.favicon,
      isClosed: tab.isClosed,
    };
  }

  urlBarData(tab: Tab | null): IURLTabData {
    const data: IURLTabData = {
      safe: true,
      url: '',
      loading: false,
      tabId: -1,
    };

    if (!tab) {
      return data;
    }

    data.safe = true; // TODO implement safe check
    data.url = tab.url || '';
    data.loading = tab.loading;
    data.tabId = tab.id;

    return data;
  }

  tabsEntities(window: Window): ITabEntity[] {
    const tabs = this._browser.tabs;
    const selectedDesktop = window.selectedDesktop;
    const selectedTab = selectedDesktop.selectedTabContainer?.selectedTab;

    return tabs
      .filter((t) => !t.tab.isClosed)
      .map((item) => ({
        id: item.tab.id.toString(),
        label: item.tab.title,
        selected: selectedTab?.id === item.tab.id,
        url: item.tab.url,
        partitionId: item.tab.partition.id,
        partitionColor: item.tab.partition.color,
        lastAccessed: item.tab.lastAccessed,
        suspended: item.tab.suspended,
        extra: `Desktop: ${item.desktop.label}`,
        isDimmed: item.tab.suspended,
      }));
  }

  findInPageResult(tab: Tab, requestId: TFindInPageId): IFindInPageResult | null {
    const findInPage = tab.findInPage;
    if (!findInPage) {
      return null;
    }

    const search = findInPage.getSearch(requestId);
    if (!search || !search.result) {
      return null;
    }

    return {
      requestId: search.requestId,
      query: search.query,
      activeMatch: search.result.activeMatchOrdinal,
      matches: search.result.matches,
    };
  }

  tabContainersEntities(window: Window): ITabContainerEntity[] {
    const desktop = window.selectedDesktop;
    const selectedTabContainer = desktop.selectedTabContainer;
    return desktop.tabContainers.map((tc) => ({
      id: tc.id.toString(),
      label: tc.tabs.map((t) => t.title).join(' | '),
      selected: selectedTabContainer?.id === tc.id,
    }));
  }

  bookmarksEntities(): IBookmarkEntity[] {
    return bookmarks.plainList.map((bm) => ({
      id: bm.url,
      label: bm.name,
      extra: bm.path.join('/'),
    }));
  }

  bookmarks(): IBookmark[] {
    return bookmarks.all;
  }

  tabNavigation(tab?: Tab): ITabNavigation {
    if (!tab) {
      return {
        canGoBack: false,
        canGoForward: false,
        loading: false,
        hasURL: false,
        tabId: -1,
      };
    }

    return {
      canGoBack: tab.canGoBack,
      canGoForward: tab.canGoForward,
      loading: tab.loading,
      hasURL: !!tab.url,
      tabId: tab.id,
    };
  }

  downloads(): IDownloads {
    const downloads = this._browser.downloads.all;
    const downloadsLength = downloads.length;

    const progress =
      downloadsLength === 0
        ? 0
        : Math.ceil((downloads.reduce((sum, d) => sum + d.progress, 0) / downloadsLength) * 100);

    return {
      progress,
      downloading: downloads.some((download) => download.status === EDownloadStatus.InProgress),
      items: downloads.map((download) => ({
        savePath: download.savePath,
        fileName: download.fileName,
        progress: Math.ceil(download.progress * 100),
        status: download.status,
        visited: download.visited,
        created: download.created,
      })),
    };
  }

  tabSwitcherData(window: Window): ITabSwitcherTab[] {
    const sortedTabs = window.tabs
      .filter((tab) => !tab.tab.suspended)
      .sort((a, b) => a.tab.lastAccessed - b.tab.lastAccessed)
      .reverse();

    if (sortedTabs.length > 1) {
      const firstTab = sortedTabs[0];
      sortedTabs[0] = sortedTabs[1];
      sortedTabs[1] = firstTab;
    }

    return sortedTabs.map((tab) => ({
      id: tab.tab.id,
      title: tab.tab.title,
      partitionColor: tab.tab.partition.color,
      desktopName: tab.desktop.name,
    }));
  }

  closedTabsEntities(): IEntity[] {
    return this._browser.closedTabs.map((tab) => ({
      id: tab.tab.id.toString(),
      label: tab.tab.title,
      extra: dayjs(tab.tab.closedAt).format('YYYY-MM-DD HH:mm:ss'),
    }));
  }

  extensions(active = false): IExtensions {
    return {
      path: extensionsPath(),
      extensions: active ? this._browser.extensions.active : this._browser.extensions.all,
    };
  }

  layoutsEntities(): IEntity[] {
    const selectedTab = this._browser.selectedTab;
    const selectedLayoutId = selectedTab?.tabContainer.layout.id;

    return Object.values(Layouts).map((layout) => ({
      id: layout.id,
      label: layout.label,
      selected: selectedLayoutId === layout.id,
    }));
  }

  desktops(window: Window) {
    const result: IDesktop[] = window.desktops.map((desk) => ({
      id: desk.id,
      name: desk.name,
      selected: desk.id === window.selectedDesktop.id,
      requireAttention: desk.requireAttention,
      hasTabs: desk.hasTabs,
      hasActiveTabs: desk.hasActiveTabs,
    }));
    return result;
  }

  debugWebContents(): IDebugWebContent[] {
    const webContents: { wc: WebContents; winId: TWindowId; visible: boolean }[] = [];

    for (const win of this._browser.windows) {
      webContents.push({ winId: win.id, wc: win.bw.webContents, visible: true });

      const views = win.bw.getContentView().children as WebContentsView[];
      for (const view of views) {
        webContents.push({ winId: win.id, wc: view.webContents, visible: view.getVisible() });
      }
    }

    return webContents.map((row) => ({
      winId: row.winId,
      url: row.wc.getURL(),
      title: row.wc.getTitle(),
      pid: row.wc.getOSProcessId(),
      visible: row.visible,
      preloads: row.wc.session
        .getPreloadScripts()
        .map((p) => ({ filePath: p.filePath, type: p.type })),
      partition: getPartitionInfo(row.wc.session),
      ...webContentsMemoryAndCPU(row.wc),
    }));
  }

  debugTabIndex(): IDebugTabIndex[] {
    const response: IDebugTabIndex[] = [];

    for (const [idxTabId, tabData] of this._browser.tabIndex.entries()) {
      response.push({
        indexTabId: idxTabId,
        winId: tabData.window.id,
        desktopId: tabData.desktop.id,
        tabContainerID: tabData.tabContainer.id,
        tab: {
          id: tabData.tab.id,
          title: tabData.tab.title,
        },
      });
    }

    return response;
  }

  about(): IAbout {
    return {
      version: app.getVersion(),
    };
  }
}
