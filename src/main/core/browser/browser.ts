import {
  getCommand,
  TCommandTrigger,
  Window,
  Session,
  IWindowProps,
  getTheme,
  Downloads,
  Extensions,
  partitions,
  WelcomeWindow,
  TabPreview,
  history,
  MediaManager,
  AppUpdater,
} from '@/core';
import { Desktop } from '@/core/desktop/desktop';
import { TabContainer } from '@/core/tab/tab-container';
import { Tab } from '@/core/tab/tab';
import { IWinDes, IWinDesCon, IWinDesConTab, TTabContainerId, TTabId, TWindowId } from '~/types';
import { mainMenu, minimumMenu } from '@/menu';
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
import { INTERNAL_PROTOCOL } from '~/constants';

const scopeLog = log.scope('Browser');

export class Browser {
  private readonly _windows: Map<TWindowId, Window> = new Map();
  private _activeWindowId: TWindowId | null = null;
  private readonly _tabIndex: Map<TTabId, IWinDesConTab> = new Map();
  private readonly _webContentsIndex: Map<number, TTabId> = new Map();
  private readonly _tabContainerIndex: Map<TTabContainerId, IWinDesCon> = new Map();
  private _welcomeWindow: WelcomeWindow | null = null;

  public readonly eventsChannel = new EventEmitter();
  public readonly renderer = new BrowserRenderer(this);
  public readonly toRenderer = new BrowserToRenderer(this);
  public readonly idGenerator = new IdGenerator(this);
  public readonly downloads = new Downloads(this);
  public readonly extensions = new Extensions(this);
  public readonly mediaManager = new MediaManager(this);
  public readonly appUpdater = new AppUpdater(this);

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

    const pendingContainerParents: {
      tabContainer: TabContainer;
      parentTabId: number;
      desktop: Desktop;
    }[] = [];

    for (const winStore of session.windows) {
      const newWindow = this.createWindow(winStore.id, {
        bounds: winStore.bounds,
      });

      for (const deskStore of winStore.desktops) {
        const theme = getTheme(deskStore.theme);
        const { shortName, longName } = deskStore;

        const desktop = newWindow.createDesktop(deskStore.id, { theme, shortName, longName });
        if (!desktop) continue;

        const sortedContainers = [...deskStore.tabContainers].sort((a, b) => {
          const ap = typeof a.position === 'number' ? a.position : 0;
          const bp = typeof b.position === 'number' ? b.position : 0;
          return ap - bp;
        });

        for (let i = 0; i < sortedContainers.length; i++) {
          const tabConStore = sortedContainers[i];
          const tabContainer = desktop.createTabContainer(tabConStore.id, {
            divider: tabConStore.divider,
            justAfter: i > 0 ? sortedContainers[i - 1]?.id : undefined,
          });

          this._indexTabContainer(newWindow, desktop, tabContainer);

          const sortedTabs = [...tabConStore.tabs].sort((a, b) => {
            const ap = typeof a.position === 'number' ? a.position : 0;
            const bp = typeof b.position === 'number' ? b.position : 0;
            return ap - bp;
          });

          for (let j = 0; j < sortedTabs.length; j++) {
            const tabStore = sortedTabs[j];
            const partition =
              tabStore.url && tabStore.url.startsWith(`${INTERNAL_PROTOCOL}://`)
                ? partitions.internal
                : partitions.get(tabStore.partitionId) || partitions.default;

            const tab = tabContainer.createTab(tabStore.id, {
              partition,
              title: tabStore.title,
              customTitle: tabStore.customTitle,
              url: tabStore.url,
              favicon: tabStore.favicon,
              closedAt: tabStore.closedAt,
              openTabsAsChild: tabStore.openTabsAsChild,
            });

            this._indexTab(newWindow, desktop, tabContainer, tab);

            if (tab.isClosed) {
              tabContainer.excludeTabFromOrder(tab.id);
            }
          }

          if (tabContainer.isClosed) {
            desktop.excludeTabContainerFromOrder(tabContainer.id);
          }

          if (tabConStore.parentTabId !== null) {
            pendingContainerParents.push({
              tabContainer,
              parentTabId: tabConStore.parentTabId,
              desktop,
            });
          }
        }
      }

      newWindow.selectDesktop(winStore.selectedDesktopId);
    }

    for (const { tabContainer, parentTabId, desktop } of pendingContainerParents) {
      const parentResult = this.getTab(parentTabId);
      if (parentResult) {
        tabContainer.setParentTab(parentResult.tab);
        desktop.excludeTabContainerFromOrder(tabContainer.id);
      } else {
        scopeLog.warn(
          `TabContainer ${tabContainer.id} references non-existent parent tab ${parentTabId}; treating as orphan`,
        );
      }
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
    const w = this._windows.get(id);
    if (!w) {
      scopeLog.warn(`No window found with id ${id}`);
      return;
    }

    for (const desktop of w.desktops) {
      for (const tabContainer of desktop.tabContainers) {
        this._tabContainerIndex.delete(tabContainer.id);
        for (const tab of tabContainer.tabs) {
          this._unindexTab(tab.id);
        }
      }
    }

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

    const selectedTab = this.selectedTab;
    if (selectedTab && props?.targetId === 'current-tab') {
      selectedTab.tab.loadURL(url);
      return selectedTab;
    }

    const shouldSetParent = !props?.skipParent && selectedTab && selectedTab.tab.openTabsAsChild;

    const result = parseTarget(this, {
      targetId: props?.targetId,
      partitionId: props?.partitionId,
      parentTab: undefined,
    });

    if (shouldSetParent && result && result.desktop === selectedTab!.desktop) {
      result.tabContainer.setParentTab(selectedTab!.tab);
      result.desktop.excludeTabContainerFromOrder(result.tabContainer.id);
    }

    if (!result) {
      scopeLog.error('Invalid target for opening URL');
      return null;
    }

    const { window, desktop, tabContainer, partition } = result;

    this._indexTabContainer(window, desktop, tabContainer);

    const intPartition = url.startsWith(`${INTERNAL_PROTOCOL}://`) ? partitions.internal : null;

    const tab = tabContainer.createTab(this.idGenerator.nextTabId, {
      partition: intPartition || partition,
      suspended: false,
      url,
    });

    this._indexTab(window, desktop, tabContainer, tab);

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

    this._indexTabContainer(targetData.window, targetData.desktop, targetData.tabContainer);

    if (targetId === 'split-tab') {
      targetData.tabContainer.addTab(sourceData.tab);
      this._indexTab(
        targetData.window,
        targetData.desktop,
        targetData.tabContainer,
        sourceData.tab,
      );
      if (props?.selectTab) {
        targetData.tabContainer.selectTab(sourceData.tab.id);
      }

      this._unindexTabContainer(sourceData.tabContainer.id);
      sourceData.desktop.deleteTabContainer(sourceData.tabContainer.id);
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

    this._unindexTabContainer(sourceData.tabContainer.id);

    sourceData.desktop.deleteTabContainer(sourceData.tabContainer.id);
    targetData.desktop.addTabContainer(sourceData.tabContainer);

    this._indexTabContainer(targetData.window, targetData.desktop, sourceData.tabContainer);

    for (const tab of sourceData.tabContainer.tabs) {
      this._indexTab(targetData.window, targetData.desktop, sourceData.tabContainer, tab);
    }

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

  private _indexTab(window: Window, desktop: Desktop, tabContainer: TabContainer, tab: Tab): void {
    this._tabIndex.set(tab.id, { window, desktop, tabContainer, tab });
    if (!tab.isDestroyed) {
      this._webContentsIndex.set(tab.webContentsId, tab.id);
    }
  }

  private _unindexTab(tabId: TTabId): void {
    const entry = this._tabIndex.get(tabId);
    if (entry) {
      if (!entry.tab.isDestroyed) {
        this._webContentsIndex.delete(entry.tab.webContentsId);
      }
      this._tabIndex.delete(tabId);
    }
  }

  private _indexTabContainer(window: Window, desktop: Desktop, tabContainer: TabContainer): void {
    this._tabContainerIndex.set(tabContainer.id, { window, desktop, tabContainer });
  }

  private _findDescendantContainers(root: Tab): TabContainer[] {
    const allContainers: TabContainer[] = this.windows.flatMap((w) =>
      w.desktops.flatMap((d) => d.tabContainers),
    );
    const result: TabContainer[] = [];
    const stack = allContainers.filter((tc) => tc.parentTab === root);
    while (stack.length > 0) {
      const current = stack.pop()!;
      result.push(current);
      const tabIds = new Set(current.tabs.map((t) => t.id));
      stack.push(
        ...allContainers.filter((tc) => tc.parentTab !== null && tabIds.has(tc.parentTab.id)),
      );
    }
    return result;
  }

  private _unindexTabContainer(tabContainerId: TTabContainerId): void {
    this._tabContainerIndex.delete(tabContainerId);
  }

  reindexWebContents(tab: Tab): void {
    if (!tab.isDestroyed) {
      this._webContentsIndex.set(tab.webContentsId, tab.id);
    }
  }

  removeWebContentsIndex(webContentsId: number): void {
    this._webContentsIndex.delete(webContentsId);
  }

  getTab(id: TTabId): IWinDesConTab | null {
    return this._tabIndex.get(id) || null;
  }

  getTabByWebContentsId(webContentsId: number): IWinDesConTab | null {
    const tabId = this._webContentsIndex.get(webContentsId);
    if (!tabId) {
      return null;
    }
    return this._tabIndex.get(tabId) || null;
  }

  get selectedTab(): IWinDesConTab | null {
    const activeWindow = this.activeWindow;
    if (!activeWindow) return null;
    const selected = activeWindow.selectedTab;
    if (!selected) return null;
    return {
      window: activeWindow,
      desktop: selected.desktop,
      tabContainer: selected.tabContainer,
      tab: selected.tab,
    };
  }

  get selectedDesktop(): IWinDes | null {
    const activeWindow = this.activeWindow;
    if (!activeWindow) {
      return null;
    }
    return { window: activeWindow, desktop: activeWindow.selectedDesktop };
  }

  getTabContainer(id: TTabContainerId): IWinDesCon | null {
    return this._tabContainerIndex.get(id) || null;
  }

  get tabs(): IWinDesConTab[] {
    return Array.from(this._tabIndex.values());
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

    tabPreview.closeWebContents();

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
    this._indexTabContainer(parentTabData.window, parentTabData.desktop, tabContainer);

    tabContainer.addTab(tabPreview.tab);
    this._indexTab(parentTabData.window, parentTabData.desktop, tabContainer, tabPreview.tab);
    tabContainer.selectTab(tabPreview.tab.id);
    parentTabData.desktop.selectTabContainer(tabContainer.id);

    tabPreview.tab.clearParent();
    tabPreview.tab.setIsTabPreview(false);

    parentTabData.window.removeView(tabPreview.viewId);
    tabPreview.closeWebContents();

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
    this._indexTab(
      parentTabData.window,
      parentTabData.desktop,
      parentTabData.tabContainer,
      tabPreview.tab,
    );
    parentTabData.tabContainer.selectTab(tabPreview.tab.id);
    parentTabData.desktop.selectTabContainer(parentTabData.tabContainer.id);

    tabPreview.tab.clearParent();
    tabPreview.tab.setIsTabPreview(false);

    parentTabData.window.removeView(tabPreview.viewId);
    tabPreview.closeWebContents();

    parentTabData.tab.setTabPreview(null);

    parentTabData.window.renderViews();

    this.eventsChannel.emit('tabpreview:split', parentTabData.window, tabPreview.tab);
  }

  permanentlyCloseTab(desktop: Desktop, tabContainer: TabContainer, tabId: TTabId) {
    this._unindexTab(tabId);
    tabContainer.deleteTab(tabId);
    history.delete(tabId);

    if (tabContainer.tabs.length === 0) {
      this._unindexTabContainer(tabContainer.id);
      desktop.deleteTabContainer(tabContainer.id);
      if (desktop.selectedTabContainer?.id === tabContainer.id) {
        desktop.selectTabContainer(null);
      }
    }
  }

  /**
   * Mark tab as closed and remove its webContents from the index.
   * The tab will be removed from the UI on the next render cycle, allowing any close animations to play smoothly.
   *
   * @param id - The ID of the tab to close
   * @returns true if the tab was found and closed, false otherwise
   */
  async closeTab(id: TTabId, props: { emit?: boolean } = { emit: true }): Promise<boolean> {
    const result = this.getTab(id);
    if (!result) {
      return false;
    }

    const { tab } = result;

    if (tab.isClosed) {
      return false;
    }

    for (const descendant of this._findDescendantContainers(tab)) {
      for (const t of descendant.tabs) {
        if (!t.isClosed) {
          await this.closeTab(t.id, props);
        }
      }
    }

    const { window, tabContainer, desktop } = result;

    if (tab.partition.private) {
      this.permanentlyCloseTab(desktop, tabContainer, tab.id);
    } else {
      tab.markAsClosed();
      tabContainer.excludeTabFromOrder(tab.id);
      if (tabContainer.isClosed) {
        desktop.excludeTabContainerFromOrder(tabContainer.id);
      }
    }

    tab.closeWebContents();
    tab.clearFailLoad();

    if (tabContainer.isClosed) {
      desktop.selectTabContainer(null);
      tabContainer.selectTab(null);
    }

    window.removeAllTabViews(tab.id);
    window.renderViews();

    this.mediaManager.removeSession(tab.id);

    if (props.emit) {
      this.eventsChannel.emit('window:tab-did-close', window);
    }

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

    this._unindexTab(lastTab.id);

    const newTabContainer = desktop.createTabContainer(this.idGenerator.nextTabContainerId, {
      justAfter: tabContainer.id,
    });
    this._indexTabContainer(window, desktop, newTabContainer);

    newTabContainer.addTab(lastTab);
    this._indexTab(window, desktop, newTabContainer, lastTab);

    window.renderViews();
    window.selectTab(lastTab.id);

    this.eventsChannel.emit('tabcontainer:did-unsplit', window, desktop);
  }

  get tabIndex(): Map<TTabId, IWinDesConTab> {
    return this._tabIndex;
  }

  showWelcome() {
    Menu.setApplicationMenu(minimumMenu());
    scopeLog.info('Showing welcome window');
    this._welcomeWindow = new WelcomeWindow(this);
  }

  setWelcomeWindow(win: WelcomeWindow | null) {
    this._welcomeWindow = win;
  }

  get welcomeWindow(): WelcomeWindow | null {
    return this._welcomeWindow;
  }

  openTabPreview(win: Window, parent: Tab, url: string) {
    const previewTab = new Tab(this, this.idGenerator.nextTabId, {
      partition: parent.partition,
      suspended: false,
      parent,
    });
    previewTab.setIsTabPreview(true);

    previewTab.setVisible(true);
    previewTab.loadURL(url);

    const tabPreview = new TabPreview(parent, previewTab);
    parent.setTabPreview(tabPreview);

    win.addView(tabPreview);
    win.addView(tabPreview.tab);

    win.renderViews();

    this.toRenderer.refreshTabContainers(win);
    this.refreshMainMenu();
  }

  get closedTabs(): IWinDesConTab[] {
    return this.tabs.filter((t) => t.tab.isClosed);
  }

  get hasClosedTabs(): boolean {
    return this.tabs.some((t) => t.tab.isClosed);
  }

  get mostRecentlyClosedTab(): IWinDesConTab | null {
    const closedTabs = this.closedTabs;
    if (closedTabs.length === 0) {
      return null;
    }

    closedTabs.sort((a, b) => {
      const aClosedAt = a.tab.closedAt || 0;
      const bClosedAt = b.tab.closedAt || 0;
      return bClosedAt - aClosedAt;
    });

    return closedTabs[0];
  }

  saveSession() {
    if (this.windows.length === 0) {
      scopeLog.warn('No windows to save in session');
      return;
    }

    const session = new Session(this);
    session.save();

    for (const result of this.tabs) {
      if (result.tab.suspended || result.tab.partition.private) {
        continue;
      }
      result.tab.saveHistory();
    }
  }
}
