import {
  getCommand,
  TCommandTrigger,
  Window,
  Session,
  IWindowProps,
  getTheme,
  getPartitions,
  defaultPartition,
  internalPartition,
  openURLHistory,
  Downloads,
  closedHistory,
  Extensions,
} from '@/core';
import { IWinDes, IWinDesCon, IWinDesConTab, TTabContainerId, TTabId, TWindowId } from '~/types';
import { mainMenu } from '@/menu';
import { Menu, BrowserWindow } from 'electron';
import EventEmitter from 'events';
import { registerBrowserEvents } from './events';
import log from 'electron-log';
import { BrowserRenderer } from './renderer.from';
import { BrowserToRenderer } from './renderer.to';
import { IMoveTabProps, IOpenUrlProps } from './types';
import { parseQuery, parseTarget } from './helpers';
import { IdGenerator } from './idgenerator';
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

      const partitions = getPartitions();

      for (const deskStore of winStore.desktops) {
        const theme = getTheme(deskStore.theme);
        const { name } = deskStore;

        const desktop = newWindow.createDesktop(deskStore.id, { theme, name });

        for (const tabConStore of deskStore.tabContainers) {
          const tabContainer = desktop.createTabContainer(tabConStore.id, {
            divider: tabConStore.divider,
          });

          for (const tabStore of tabConStore.tabs) {
            const partition =
              tabStore.url && tabStore.url.startsWith(`${INTERNAL_PROTOCOL}://`)
                ? internalPartition
                : partitions.get(tabStore.partitionId) || defaultPartition;

            tabContainer.createTab(tabStore.id, {
              partition,
              title: tabStore.title,
              customTitle: tabStore.customTitle,
              url: tabStore.url,
            });
          }
        }
      }

      newWindow.selectDesktop(winStore.selectedDesktopId);
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
  ): Promise<boolean> {
    const command = getCommand(trigger);
    if (!command) {
      scopeLog.error(`Command not found for trigger: ${trigger}`);
      return false;
    }

    const desktop = window.selectedDesktop;
    const tabContainer = desktop?.selectedTabContainer || null;
    const tab = tabContainer?.selectedTab || null;

    await command.handler({ browser: this, window, desktop, tabContainer, tab, params });

    await this.refreshMainMenu();

    return true;
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

    const intPartition = url.startsWith(`${INTERNAL_PROTOCOL}://`) ? internalPartition : null;

    const tab = tabContainer.createTab(this.idGenerator.nextTabId, {
      partition: intPartition || partition,
      suspended: false,
    });

    if (props?.selectTab) {
      tabContainer.selectTab(tab.id);
      desktop.selectTabContainer(tabContainer.id);
    }

    this.eventsChannel.emit('browser:url-opened', window);

    window.addView(tab);
    window.renderViews();

    if (!partition.private) {
      openURLHistory.add(url);
    }

    tab.loadURL(url);

    return { window, desktop, tabContainer, tab };
  }

  async moveTab(tabId: TTabId, targetId: string, props?: IMoveTabProps) {
    const tabResult = this.getTab(tabId);
    if (!tabResult) {
      scopeLog.error(`Tab with id ${tabId} not found`);
      return;
    }

    const targetResult = parseTarget(this, {
      targetId: targetId,
      partitionId: tabResult.tab.partition.id,
      tabContainer: tabResult.tabContainer,
    });

    if (!targetResult) {
      scopeLog.error(`Invalid targetId provided for moving tab: ${targetId}`);
      return;
    }

    if (
      tabResult.window.id == targetResult.window.id &&
      tabResult.desktop.id == targetResult.desktop.id
    ) {
      scopeLog.warn('Tab is already in the target desktop/window');
      return;
    }

    tabResult.desktop.closeTabContainer(tabResult.tabContainer.id);
    targetResult.desktop.addTabContainer(tabResult.tabContainer);

    if (tabResult.window.id !== targetResult.window.id) {
      tabResult.window.removeView(tabResult.tab.viewId);
      targetResult.window.addView(tabResult.tab);
    }

    tabResult.window.renderViews();
    targetResult.window.renderViews();

    if (props?.selectTab) {
      targetResult.window.selectTab(tabResult.tab.id);
    }

    this.eventsChannel.emit(
      'browser:tab-did-move',
      tabResult.tab.id,
      tabResult.window,
      tabResult.desktop,
      targetResult.window,
      targetResult.desktop,
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
      for (const desktop of window.desktops) {
        const selectedTabContainer = desktop.selectedTabContainer;
        if (selectedTabContainer) {
          const selectedTab = selectedTabContainer.selectedTab;
          if (selectedTab) {
            return { window, desktop, tabContainer: selectedTabContainer, tab: selectedTab };
          }
        }
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
    const tabData = this.getTab(tabId);
    if (!tabData) {
      scopeLog.warn(`Tab with id ${tabId} not found for closing preview`);
      return;
    }

    const tabPreview = tabData.tab.tabPreview;
    if (!tabPreview) {
      scopeLog.warn(`No preview tab found for Tab ID ${tabData.tab.id}`);
      return;
    }

    tabData.window.removeView(tabPreview.tab.viewId);
    tabData.window.removeView(tabPreview.viewId);

    tabData.tab.setTabPreview(null);

    tabPreview.close();

    tabData.window.renderViews();

    this.eventsChannel.emit('tabpreview:closed', tabData.window);
  }

  acceptTabPreview(tabId: TTabId) {
    const tabData = this.getTab(tabId);
    if (!tabData) {
      scopeLog.warn(`Tab with id ${tabId} not found for accepting preview`);
      return;
    }

    const tabPreview = tabData.tab.tabPreview;
    if (!tabPreview) {
      scopeLog.warn(`No preview tab found for Tab ID ${tabData.tab.id}`);
      return;
    }

    const tabContainer = tabData.desktop.createTabContainer(this.idGenerator.nextTabContainerId);
    tabContainer.addTab(tabPreview.tab);
    tabContainer.selectTab(tabPreview.tab.id);

    tabData.desktop.selectTabContainer(tabContainer.id);

    tabPreview.tab.clearParent();

    tabData.window.removeView(tabPreview.viewId);
    tabPreview.close();

    tabData.tab.setTabPreview(null);

    tabData.window.renderViews();

    this.eventsChannel.emit('tabpreview:accepted', tabData.window);
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

    // Remove views
    for (const view of window.views) {
      if (view.viewId.startsWith(`tab-${tab.id}#`)) {
        view.close();
        window.removeView(view.viewId);
      }
    }

    window.renderViews();

    if (!tab.partition.private && tab.url) {
      closedHistory.addTab(tab.title, tab.url);
    }

    this.eventsChannel.emit('window:tab-did-close', window);

    return true;
  }
}
