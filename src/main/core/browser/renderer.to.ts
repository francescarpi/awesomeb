import { Browser, Window, Desktop, Tab, partitions, config, type IMediaSessionState } from '@/core';
import { TabSwitcher, TabMarks } from '@/ui';
import { UIContextualModal } from '@/ui/modal/models';
import log from 'electron-log';
import { INTERNAL_PROTOCOL } from '~/constants';
import type {
  ITheme,
  TFindInPageId,
  ILayoutData,
  IMediaSession,
  IAppUpdaterInfo,
  IDesConTab,
} from '~/types';

const scopeLog = log.scope('BrowserRendererEmmiter');

export class BrowserToRenderer {
  constructor(private readonly _browser: Browser) {}

  refreshDesktops(window: Window) {
    const desktops = this._browser.renderer.desktops(window);
    window.sendMessage('desktops:refresh-visible', desktops);
    scopeLog.info('Desktops refreshed in renderer');
  }

  refreshSelectedDesktop(window: Window) {
    const desktop = window.selectedDesktop;
    window.sendMessage('desktops:refresh-selected', desktop.id);
  }

  refreshThemes(window: Window, desktop: Desktop) {
    const result: ITheme = {
      primary: desktop.theme.primary,
      secondary: desktop.theme.secondary,
      degrees: desktop.theme.degrees,
    };
    window.sendMessage('desktop:theme-refresh', result);
  }

  refreshTabContainers(window: Window) {
    const tabContainers = this._browser.renderer.tabContainers(window);
    window.sendMessage('tabs:refresh', tabContainers);
  }

  refreshOneTab(window: Window, desktop: Desktop, tab: Tab) {
    const selectedTabContainer = desktop.selectedTabContainer;
    // No selected container → no `selected` flag to compute. Skip the IPC
    // rather than sending a refresh that would mark every other tab as
    // unselected for one tick (the next tabs:refresh will correct it).
    if (!selectedTabContainer) return;
    window.sendMessage(
      'tabs:refresh-one',
      this._browser.renderer.tab(window, desktop, selectedTabContainer, tab),
    );
  }

  refreshURLBar(window: Window, tabData: IDesConTab | null) {
    window.sendMessage('urlbar:refresh', this._browser.renderer.urlBarData(tabData));
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

  refreshDownloads() {
    const data = this._browser.renderer.downloads();
    for (const window of this._browser.windows) {
      window.sendMessage('downloads:refresh', data);

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

  refreshDownloadCompleted() {
    for (const window of this._browser.windows) {
      window.sendMessage('downloads:completed');
    }
  }

  refreshTabSwitcher(window: Window) {
    // No-op when the switcher view is missing or hidden: a hidden re-render
    // would trigger the renderer's full list re-render + per-tab favicon IPC
    // round-trips for an invisible view. The showTabSwitcher override in the
    // core Window refreshes it exactly on the hidden→visible transition.
    const tabSwitcher = window.getView<TabSwitcher>('tab-switcher');
    if (!tabSwitcher || !tabSwitcher.visible) return;
    tabSwitcher.send('tabswitcher:refresh', this._browser.renderer.tabSwitcherData(window));
  }

  refreshLayoutData(window: Window) {
    const selectedTab = window.selectedTab;
    const data: ILayoutData = {
      sidebarCollapsed: window.sidebarCollapsed,
      areaMaximized: window.areaMaximized,
      hasVisibleTabs: window.hasTabsVisible,
      selectedTabBounds: selectedTab ? selectedTab.tab.bounds : null,
      selectedTabPartitionColor: selectedTab ? selectedTab.tab.partition.color : null,
      sidebarWidth: window.sidebarWidth,
    };

    window.sendMessage('window:refresh-layout-data', data);
  }

  refreshExtensions(window: Window) {
    const selectedTab = window.selectedTab;
    if (!selectedTab) {
      window.sendMessage('extensions:on-refresh', []);
      return;
    }

    if (selectedTab.tab.partition.id === partitions.internal.id) {
      window.sendMessage('extensions:on-refresh', []);
      return;
    }

    window.sendMessage('extensions:on-refresh', this._browser.extensions.active);
  }

  refreshConfig() {
    for (const window of this._browser.windows) {
      window.sendMessage('config:refresh', config.config);

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

  refreshMediaSession(win: Window) {
    const selectedTab = win.selectedTab;
    const session = this._browser.mediaManager.lastSession;
    if (!session || !session.data || (selectedTab && selectedTab.tab.id === session.tabId)) {
      win.webContents.send('media:session-update', null);
      return;
    }
    win.webContents.send('media:session-update', this.mediaSessionData(session));
  }

  refreshVersionAvailable(win: Window, data: IAppUpdaterInfo) {
    win.webContents.send('appupdater:version-available', data);
  }

  broadcast(channel: string, ...args: unknown[]) {
    for (const window of this._browser.windows) {
      window.sendMessage(channel, ...args);
    }
  }

  refreshSidebarDrag(window: Window, dragable: boolean) {
    window.sendMessage('sidebar:change-drag', dragable);
  }
}
