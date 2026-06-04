import { Browser, Window, Desktop, Tab, partitions, config, type IMediaSessionState } from '@/core';
import { Sidebar, TabSwitcher, URLBar, TabMarks } from '@/ui';
import { UIContextualModal } from '@/ui/modal/models';
import log from 'electron-log';
import { INTERNAL_PROTOCOL } from '~/constants';
import type { ITheme, TFindInPageId, ILayoutData, IMediaSession } from '~/types';

const scopeLog = log.scope('BrowserRendererEmmiter');

export class BrowserToRenderer {
  constructor(private readonly _browser: Browser) {}

  refreshDesktops(window: Window) {
    const sidebar = window.getView<Sidebar>('sidebar')!;
    const desktops = this._browser.renderer.desktops(window);
    sidebar.send('desktops:refresh-visible', desktops);
    scopeLog.info('Desktops refreshed in renderer');
  }

  refreshSelectedDesktop(window: Window) {
    const desktop = window.selectedDesktop;
    const sidebar = window.getView<Sidebar>('sidebar')!;
    sidebar.send('desktops:refresh-selected', desktop.id);
  }

  refreshThemes(window: Window, desktop: Desktop) {
    const result: ITheme = {
      primary: desktop.theme.primary,
      secondary: desktop.theme.secondary,
      degrees: desktop.theme.degrees,
    };
    window.webContents.send('desktop:theme-refresh', result);
  }

  refreshTabContainers(window: Window) {
    const sidebar = window.getView<Sidebar>('sidebar')!;
    const tabContainers = this._browser.renderer.tabContainers(window);
    sidebar.send('tabs:refresh', tabContainers);
  }

  refreshURLBar(window: Window, tab: Tab | null) {
    const urlbar = window.getView<URLBar>('urlbar')!;
    urlbar.send('urlbar:refresh', this._browser.renderer.urlBarData(tab));
  }

  refreshTabFindInPageResult(tab: Tab, requestId: TFindInPageId) {
    if (!tab.findInPage) {
      scopeLog.error('Trying to refresh find in page result for a tab that does not have it');
      return;
    }

    tab.findInPage.send(
      'tabs:refresh-find-in-page',
      this._browser.renderer.findInPageResult(tab, requestId),
    );
  }

  refreshTabNavigation(window: Window, tab?: Tab) {
    const data = this._browser.renderer.tabNavigation(tab);
    const urlbar = window.getView<URLBar>('urlbar')!;
    urlbar.send('urlbar:refresh-tab-navigation', data);
  }

  refreshDownloads() {
    const data = this._browser.renderer.downloads();
    for (const window of this._browser.windows) {
      const sidebar = window.getView<Sidebar>('sidebar')!;
      sidebar.send('downloads:refresh', data);

      const contextualModal = window.getView<UIContextualModal>('contextual-modal');
      if (contextualModal) {
        contextualModal.send('downloads:refresh', data);
      }

      // ...and to all "downloads" pages
      for (const page of window.views) {
        const pageURL = page.webContents.getURL();
        if (pageURL.startsWith(`${INTERNAL_PROTOCOL}://downloads`)) {
          page.send('downloads:refresh', data);
        }
      }
    }
  }

  refreshTabSwitcher(window: Window) {
    const tabSwitcher = window.getView<TabSwitcher>('tab-switcher')!;
    tabSwitcher.send('tabswitcher:refresh', this._browser.renderer.tabSwitcherData(window));
  }

  refreshLayoutData(window: Window) {
    const selectedTab = window.selectedTab;
    const data: ILayoutData = {
      sidebarCollapsed: window.sidebarCollapsed,
      areaMaximized: window.areaMaximized,
      hasVisibleTabs: window.tabs.some((tab) => tab.tab.visible),
      selectedTabBounds: selectedTab ? selectedTab.tab.bounds : null,
      selectedTabPartitionColor: selectedTab ? selectedTab.tab.partition.color : null,
    };
    window.webContents.send('window:refresh-layout-data', data);
  }

  refreshSidebarDrag(window: Window, dragable: boolean) {
    const sidebar = window.getView<Sidebar>('sidebar')!;
    sidebar.send('sidebar:change-drag', dragable);
  }

  refreshExtensions(window: Window) {
    const urlbar = window.getView<URLBar>('urlbar')!;

    const selectedTab = window.selectedTab;
    if (!selectedTab) {
      urlbar.send('extensions:on-refresh', []);
      return;
    }

    if (selectedTab.tab.partition.id === partitions.internal.id) {
      urlbar.send('extensions:on-refresh', []);
      return;
    }

    urlbar.send('extensions:on-refresh', this._browser.extensions.active);
  }

  refreshShowSplitMenu(window: Window) {
    const selectedTab = window.selectedTab;
    const hasSplit = selectedTab ? selectedTab.tabContainer.isSplit : false;

    const urlbar = window.getView<URLBar>('urlbar')!;
    urlbar.send('tab:has-split', hasSplit);
  }

  refreshConfig() {
    for (const window of this._browser.windows) {
      window.webContents.send('config:refresh', config.config);

      const tabSwitcher = window.getView<TabSwitcher>('tab-switcher')!;
      tabSwitcher.webContents.send('config:refresh', config.config);

      const tabMarks = window.getView<TabMarks>('tab-marks')!;
      tabMarks.webContents.send('config:refresh', config.config);
    }
  }

  mediaSessionData(session: IMediaSessionState): IMediaSession {
    if (!session.data) {
      throw new Error('Trying to get media session data for a session that has no data');
    }

    return {
      tabId: session.tabId,
      favicon: session.favicon,
      startedAt: session.startedAt,
      playbackState: session.data.playbackState,
      title: session.data.title,
      artist: session.data.artist,
      album: session.data.album,
      muted: session.wc.isAudioMuted(),
    };
  }

  refreshMediaSession(win: Window, session: IMediaSessionState | null) {
    const sidebar = win.getView<Sidebar>('sidebar')!;
    if (!session || !session.data) {
      sidebar.send('media:session-update', null);
      return;
    }
    sidebar.send('media:session-update', this.mediaSessionData(session));
  }
}
