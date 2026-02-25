import {
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
} from '~/types';
import {
  Browser,
  config,
  Desktop,
  getCommands,
  getPartitions,
  getThemes,
  Tab,
  TabContainer,
  Window,
  bookmarks,
} from '@/core';

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

  partitionsEntities(browser: Browser): IPartitionEntity[] {
    const partitions = getPartitions();
    const selectedTabResult = browser.selectedTab;
    return Array.from(partitions.values()).map((partition) => ({
      id: partition.id,
      label: partition.name,
      color: partition.color,
      selected: selectedTabResult?.tab.partition.id === partition.id,
    }));
  }

  targetsEntities(browser: Browser, window: Window): IEntity[] {
    const result = [
      {
        id: 'current-desktop-window',
        label: 'Current window/desktop',
      },
      {
        id: 'into-selected-tab-container',
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

    for (const win of browser.windows) {
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
    const desktop = window.selectedDesktop;
    const selectedTabContainer = desktop.selectedTabContainer;

    return desktop.tabContainers.map((tc) => ({
      id: tc.id,
      selected: selectedTabContainer?.id === tc.id,
      divider: tc.divider,
      tabs: tc.tabs.map((tab) => this.tab(window, desktop, selectedTabContainer, tab)),
    }));
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

  tabsEntities(browser: Browser, window: Window): ITabEntity[] {
    const tabs = browser.tabs;
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
      canGoBack: tab.view.canGoBack,
      canGoForward: tab.view.canGoForward,
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
}
