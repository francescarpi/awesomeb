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
  EDownloadStatus,
  ITabSwitcherTab,
  IExtensions,
  IVisibleDesktops,
  IDebugWebContent,
} from '~/types';
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
  closedHistory,
  partitions,
  Layouts,
} from '@/core';
import dayjs from 'dayjs';
import { extensionsPath } from '@/paths';
import { type WebContentsView } from 'electron';
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

  targetsEntities(window: Window): IEntity[] {
    const result = [
      {
        id: 'current-desktop-window',
        label: 'New tab',
      },
      {
        id: 'split-tab',
        label: 'Split into selected tab',
      },
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
      const selectedTabContainer = desktop.selectedTabContainer;
      for (const [idx, tc] of desktop.tabContainers.entries()) {
        tabContainers.push({
          id: tc.id,
          shortcut: idx < 9 ? idx + 1 : null,
          desktopId: desktop.id,
          selected: selectedTabContainer?.id === tc.id,
          divider: tc.divider,
          tabs: tc.tabs.map((tab) => this.tab(window, desktop, selectedTabContainer, tab)),
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

    return tabs.map((item) => ({
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
    return closedHistory.tabs.map((tab) => ({
      id: tab.url,
      label: tab.title,
      extra: dayjs(tab.timestamp).format('YYYY-MM-DD HH:mm:ss'),
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

  visibleDesktops(window: Window) {
    const result: IVisibleDesktops = {
      hasLess: window.hasLessDesktops,
      hasMore: window.hasMoreDesktops,
      desktops: window.visibleDesktops.map((desk) => ({
        id: desk.id,
        name: desk.name,
        selected: desk.id === window.selectedDesktop.id,
        requireAttention: desk.requireAttention,
        hasTabs: desk.hasTabs,
        hasActiveTabs: desk.hasActiveTabs,
      })),
    };
    return result;
  }

  debugWebContents(): IDebugWebContent[] {
    const result: IDebugWebContent[] = [];

    for (const win of this._browser.windows) {
      result.push({
        winId: win.id,
        url: win.bw.webContents.getURL(),
        title: win.bw.webContents.getTitle(),
        OSpid: win.bw.webContents.getOSProcessId(),
        pid: win.bw.webContents.getProcessId(),
        visible: true,
        ...webContentsMemoryAndCPU(win.bw.webContents),
        preloads: win.bw.webContents.session.getPreloadScripts().map((p) => p.filePath),
        partition: getPartitionInfo(win.bw.webContents.session),
      });

      const views = win.bw.getContentView().children as WebContentsView[];
      for (const view of views) {
        result.push({
          winId: win.id,
          url: view.webContents.getURL(),
          title: view.webContents.getTitle(),
          OSpid: view.webContents.getOSProcessId(),
          pid: view.webContents.getProcessId(),
          visible: view.getVisible(),
          ...webContentsMemoryAndCPU(view.webContents),
          preloads: view.webContents.session.getPreloadScripts().map((p) => p.filePath),
          partition: getPartitionInfo(view.webContents.session),
        });
      }
    }
    return result;
  }
}
