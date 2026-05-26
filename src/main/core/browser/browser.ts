import {
  getCommand,
  TCommandTrigger,
  Window,
  Session,
  IWindowProps,
  getTheme,
  Downloads,
  closedHistory,
  Extensions,
  partitions,
} from '@/core';
import { IWinDes, IWinDesCon, IWinDesConTab, TTabContainerId, TTabId, TWindowId } from '~/types';
import { mainMenu } from '@/menu';
import { Menu, BrowserWindow } from 'electron';
import EventEmitter from 'events';
import { registerBrowserEvents } from './events';
import { registerVisitHistoryHooks } from '@/core/visit-history';
import log from 'electron-log';
import { BrowserRenderer } from './renderer.from';
import { BrowserToRenderer } from './renderer.to';
import { IMoveTabProps, IOpenUrlProps } from './types';
import { parseQuery, parseTarget } from './helpers';
import { IdGenerator } from './idgenerator';
import { MIN_DESKTOPS } from '../window/constants';
import { INTERNAL_PROTOCOL } from '~/constants';

const scopeLog = log.scope('Browser');

export class Browser {
  private readonly _windows: Map<TWindowId, Window> = new Map();
  private _activeWindowId: TWindowId | null = null;
  public readonly eventsChannel = new EventEmitter();
  public readonly renderer = new BrowserRenderer(this);
  public readonly toRenderer = new BrowserToRenderer(this);
  public readonly idGenerator = new IdGenerator(this);
  public readonly downloads = new Downloads(this);
  public readonly extensions = new Extensions(this);

  constructor() {
    registerBrowserEvents(this);
    registerVisitHistoryHooks(this);
  }

  async loadSession() {
    const session = new Session(this);

    if (session.windows.length === 0) {
      const newWindow = this.createWindow(1);
      newWindow.createDefaultDesktops();
      await this.refreshMainMenu();
      return;
    }

    for (const winStore of session.windows) {
      const newWindow = this.createWindow(winStore.id, {
        bounds: winStore.bounds,
      });

      for (const deskStore of winStore.desktops) {
        const theme = getTheme(deskStore.theme);
        const { name } = deskStore;

        const desktop = newWindow.createDesktop(deskStore.id, { theme, name });
        if (!desktop) continue;

        for (const tabConStore of deskStore.tabContainers) {
          const tabContainer = desktop.createTabContainer(tabConStore.id, {
            divider: tabConStore.divider,
          });

          for (const tabStore of tabConStore.tabs) {
            const partition =
              tabStore.url && tabStore.url.startsWith(`${INTERNAL_PROTOCOL}://`)
                ? partitions.internal
                : partitions.get(tabStore.partitionId) || partitions.default;

            tabContainer.createTab(tabStore.id, {
              partition,
              title: tabStore.title,
              customTitle: tabStore.customTitle,
              url: tabStore.url,
              favicon: tabStore.favicon,
            });
          }
        }
      }

      newWindow.selectDesktop(winStore.selectedDesktopId);
      newWindow.visibleDesktopsRange = winStore.visibleDesktopsRange ?? [1, MIN_DESKTOPS];
    }

    await this.refreshMainMenu();
  }

  createWindow(id: TWindowId, props?: IWindowProps): Window {
    const w = new Window(this, id, props);
    this._windows.set(w.id, w);

    scopeLog.info(
      `Created window with id ${w.id} ` +
        `(Total windows: ${BrowserWindow.getAllWindows().length})`,
    );

    this._activeWindowId = w.id;

    if (props?.withDesktops) {
      w.createDefaultDesktops();
    }

    return w;
  }

  removeWindow(id: TWindowId) {
    this._windows.delete(id);
    scopeLog.info(
      `Removed window with id ${id} ` + `(Total windows: ${BrowserWindow.getAllWindows().length})`,
    );
    if (this._activeWindowId === id) {
      this._activeWindowId = null;
    }
  }

  get windows(): Window[] {
    return Array.from(this._windows.values());
  }

  getWindow(id: TWindowId): Window | null {
    return this._windows.get(id) || null;
  }

  async refreshMainMenu() {
    const items = await mainMenu(this, false);
    Menu.setApplicationMenu(items);
  }

  setActiveWindowId(id: TWindowId | null) {
    this._activeWindowId = id;
  }

  get activeWindow(): Window | null {
    if (this._activeWindowId === null) {
      return null;
    }
    return this.getWindow(this._activeWindowId);
  }

  async performCommand(
    window: Window,
    trigger: TCommandTrigger,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    const command = getCommand(trigger);
    if (!command) {
      scopeLog.error(`Command not found for trigger: ${trigger}`);
      return;
    }

    const desktop = window.selectedDesktop;
    const tabContainer = desktop?.selectedTabContainer || null;
    const tab = tabContainer?.selectedTab || null;

    const result = await command.handler({
      browser: this,
      window,
      desktop,
      tabContainer,
      tab,
      params,
    });

    if (command.onPerformed) {
      command.onPerformed(result);
    }

    await this.refreshMainMenu();

    return result;
  }

  async duplicateTab(tabId: TTabId, props?: IOpenUrlProps): Promise<IWinDesConTab | null> {
    const tabResult = this.getTab(tabId);
    if (!tabResult) {
      scopeLog.error(`Tab with id ${tabId} not found for duplication`);
      return null;
    }

    if (!tabResult.tab.url) {
      scopeLog.warn(`Tab with id ${tabId} has no URL to duplicate`);
      return null;
    }

    return this.openURL(tabResult.tab.url, props);
  }

  async openURL(query: string, props?: IOpenUrlProps): Promise<IWinDesConTab | null> {
    scopeLog.info(`Opening URL with query: ${query}`);

    const url = parseQuery(query, props?.searchEngineCode);
    if (!url) {
      scopeLog.error(`Invalid URL or query provided: ${query}`);
      return null;
    }

    const result = parseTarget(this, {
      targetId: props?.targetId,
      partitionId: props?.partitionId,
    });

    if (!result) {
      scopeLog.error('Invalid target for opening URL');
      return null;
    }

    const { window, desktop, tabContainer, partition } = result;

    const intPartition = url.startsWith(`${INTERNAL_PROTOCOL}://`) ? partitions.internal : null;

    const tab = tabContainer.createTab(this.idGenerator.nextTabId, {
      partition: intPartition || partition,
      suspended: false,
      url,
    });

    if (props?.selectTab) {
      tabContainer.selectTab(tab.id);
      desktop.selectTabContainer(tabContainer.id);
    }

    window.addView(tab);
    window.renderViews();

    this.eventsChannel.emit('browser:url-opened', window);

    tab.loadURL(url);

    return { window, desktop, tabContainer, tab };
  }

  async moveTab(tabId: TTabId, targetId: string, props?: IMoveTabProps) {
    const sourceData = this.getTab(tabId);
    if (!sourceData) {
      scopeLog.error(`Tab with id ${tabId} not found`);
      return;
    }

    const targetData = parseTarget(this, {
      targetId: targetId,
      partitionId: sourceData.tab.partition.id,
      tabContainer: sourceData.tabContainer,
    });

    if (!targetData) {
      scopeLog.error(`Invalid targetId provided for moving tab: ${targetId}`);
      return;
    }

    if (targetId === 'split-tab') {
      targetData.tabContainer.addTab(sourceData.tab);
      if (props?.selectTab) {
        targetData.tabContainer.selectTab(sourceData.tab.id);
      }

      sourceData.desktop.closeTabContainer(sourceData.tabContainer.id);
      sourceData.window.renderViews();

      this.eventsChannel.emit(
        'browser:tab-did-move',
        sourceData.tab.id,
        sourceData.window,
        sourceData.desktop,
        targetData.window,
        targetData.desktop,
      );
      return;
    }

    if (
      sourceData.window.id == targetData.window.id &&
      sourceData.desktop.id == targetData.desktop.id
    ) {
      scopeLog.warn('Tab is already in the target desktop/window');
      return;
    }

    sourceData.desktop.closeTabContainer(sourceData.tabContainer.id);
    targetData.desktop.addTabContainer(sourceData.tabContainer);

    if (sourceData.window.id !== targetData.window.id) {
      scopeLog.info(
        'Source window is different to target',
        sourceData.window.id,
        targetData.window.id,
      );
      sourceData.window.removeView(sourceData.tab.viewId, false);
      targetData.window.addView(sourceData.tab);
      targetData.window.renderViews();
    }

    sourceData.window.renderViews();

    if (props?.selectTab) {
      targetData.window.selectTab(sourceData.tab.id);
    }

    this.eventsChannel.emit(
      'browser:tab-did-move',
      sourceData.tab.id,
      sourceData.window,
      sourceData.desktop,
      targetData.window,
      targetData.desktop,
    );
  }

  getTab(id: TTabId): IWinDesConTab | null {
    for (const window of this._windows.values()) {
      const desConTab = window.getTab(id);
      if (desConTab) {
        return {
          window,
          desktop: desConTab.desktop,
          tabContainer: desConTab.tabContainer,
          tab: desConTab.tab,
        };
      }
    }
    return null;
  }

  getTabByWebcontentsId(id: number): IWinDesConTab | null {
    for (const window of this._windows.values()) {
      for (const tab of window.tabs) {
        if (tab.tab.id === id) {
          return {
            window,
            desktop: tab.desktop,
            tabContainer: tab.tabContainer,
            tab: tab.tab,
          };
        }
      }
    }
    return null;
  }

  getTabByWebContentsId(webContentsId: number): IWinDesConTab | null {
    for (const tabInfo of this.tabs) {
      if (tabInfo.tab.webContentsId === webContentsId) {
        return tabInfo;
      }
    }
    return null;
  }

  get selectedTab(): IWinDesConTab | null {
    for (const window of this._windows.values()) {
      const selectedTab = window.selectedTab;
      if (selectedTab) {
        return {
          window,
          desktop: selectedTab.desktop,
          tabContainer: selectedTab.tabContainer,
          tab: selectedTab.tab,
        };
      }
    }
    return null;
  }

  get selectedDesktop(): IWinDes | null {
    const activeWindow = this.activeWindow;
    if (!activeWindow) {
      return null;
    }
    return { window: activeWindow, desktop: activeWindow.selectedDesktop };
  }

  getTabContainer(id: TTabContainerId): IWinDesCon | null {
    for (const window of this._windows.values()) {
      for (const desktop of window.desktops) {
        for (const tabContainer of desktop.tabContainers) {
          if (tabContainer.id === id) {
            return { window, desktop, tabContainer };
          }
        }
      }
    }
    return null;
  }

  get tabs(): IWinDesConTab[] {
    const result: IWinDesConTab[] = [];
    for (const window of this._windows.values()) {
      for (const desktop of window.desktops) {
        for (const tabContainer of desktop.tabContainers) {
          for (const tab of tabContainer.tabs) {
            result.push({ window, desktop, tabContainer, tab });
          }
        }
      }
    }
    return result;
  }

  closeTabPreview(tabId: TTabId) {
    const parentTabData = this.getTab(tabId);
    if (!parentTabData) {
      scopeLog.warn(`Tab with id ${tabId} not found for closing preview`);
      return;
    }

    const tabPreview = parentTabData.tab.tabPreview;
    if (!tabPreview) {
      scopeLog.warn(`No preview tab found for Tab ID ${parentTabData.tab.id}`);
      return;
    }

    parentTabData.window.removeView(tabPreview.tab.viewId);
    parentTabData.window.removeView(tabPreview.viewId);

    parentTabData.tab.setTabPreview(null);

    tabPreview.close();

    parentTabData.window.renderViews();

    this.eventsChannel.emit('tabpreview:closed', parentTabData.window);
  }

  acceptTabPreview(tabId: TTabId) {
    const parentTabData = this.getTab(tabId);
    if (!parentTabData) {
      scopeLog.warn(`Tab with id ${tabId} not found for accepting preview`);
      return;
    }

    const tabPreview = parentTabData.tab.tabPreview;
    if (!tabPreview) {
      scopeLog.warn(`No preview tab found for Tab ID ${parentTabData.tab.id}`);
      return;
    }

    const tabContainer = parentTabData.desktop.createTabContainer(
      this.idGenerator.nextTabContainerId,
    );
    tabContainer.addTab(tabPreview.tab);
    tabContainer.selectTab(tabPreview.tab.id);
    parentTabData.desktop.selectTabContainer(tabContainer.id);

    tabPreview.tab.clearParent();

    parentTabData.window.removeView(tabPreview.viewId);
    tabPreview.close();

    parentTabData.tab.setTabPreview(null);

    parentTabData.window.renderViews();

    this.eventsChannel.emit('tabpreview:accepted', parentTabData.window, tabPreview.tab);
  }

  splitTabPreview(tabId: TTabId) {
    const parentTabData = this.getTab(tabId);
    if (!parentTabData) {
      scopeLog.warn(`Tab with id ${tabId} not found for splitting preview`);
      return;
    }

    const tabPreview = parentTabData.tab.tabPreview;
    if (!tabPreview) {
      scopeLog.warn(`No preview tab found for Tab ID ${parentTabData.tab.id}`);
      return;
    }

    parentTabData.tabContainer.addTab(tabPreview.tab);
    parentTabData.tabContainer.selectTab(tabPreview.tab.id);
    parentTabData.desktop.selectTabContainer(parentTabData.tabContainer.id);

    tabPreview.tab.clearParent();

    parentTabData.window.removeView(tabPreview.viewId);
    tabPreview.close();

    parentTabData.tab.setTabPreview(null);

    parentTabData.window.renderViews();

    this.eventsChannel.emit('tabpreview:split', parentTabData.window, tabPreview.tab);
  }

  /**
   * Closes a tab by its ID
   *
   * This method:
   * 1. Finds and closes the specified tab
   * 2. If the tab container becomes empty, it also closes the container
   * 3. Deselects the container if it was selected
   * 4. Refreshes the visible tab view
   * 5. Emits 'window:tab-did-close' event
   *
   * Note: This method does not automatically select another tab.
   * The caller is responsible for selecting a new tab if needed.
   *
   * @param id - The ID of the tab to close
   * @returns true if the tab was found and closed, false otherwise
   */
  async closeTab(id: TTabId): Promise<boolean> {
    const result = this.getTab(id);
    if (!result) {
      return false;
    }

    const { tabContainer, desktop, tab, window } = result;

    tabContainer.closeTab(tab.id);

    if (tabContainer.tabs.length === 0) {
      desktop.closeTabContainer(tabContainer.id);
      if (desktop.selectedTabContainer?.id === tabContainer.id) {
        desktop.selectTabContainer(null);
      }
    }

    window.removeAllTabViews(tab.id);
    window.renderViews();

    if (!tab.partition.private && tab.url) {
      closedHistory.addTab(tab.title, tab.url);
    }

    this.eventsChannel.emit('window:tab-did-close', window);

    return true;
  }

  unsplitTabContainer(tabContainerId: TTabContainerId) {
    const result = this.getTabContainer(tabContainerId);
    if (!result) {
      scopeLog.warn(`Tab container with id ${tabContainerId} not found for unsplitting`);
      return;
    }

    const { window, desktop, tabContainer } = result;

    if (!tabContainer.isSplit) {
      scopeLog.warn(`Tab container with id ${tabContainerId} is not split`);
      return;
    }

    const lastTab = tabContainer.popTab();
    if (!lastTab) {
      scopeLog.warn(`No tabs found in tab container with id ${tabContainerId} for unsplitting`);
      return;
    }

    const newTabContainer = desktop.createTabContainer(this.idGenerator.nextTabContainerId, {
      justAfter: tabContainer.id,
    });
    newTabContainer.addTab(lastTab);

    window.renderViews();
    window.selectTab(lastTab.id);

    this.eventsChannel.emit('tabcontainer:did-unsplit', window, desktop);
  }
}
