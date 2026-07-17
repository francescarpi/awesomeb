import { UIWindow } from '@/ui';
import type { IProps, ISelectTabProps } from './types';
import { Desktop, IDesktopProps, Browser, PromptsManager, TabContainer } from '@/core';
import { MIN_DESKTOPS, MAX_DESKTOPS } from './constants';
import {
  IContextualModalParams,
  IDesCon,
  IDesConTab,
  TDesktopId,
  TPage,
  TTabId,
  TWindowId,
} from '~/types';
import log from 'electron-log';
import { registerWindowEvents } from './events';

const scopeLog = log.scope('Window');

export class Window extends UIWindow {
  private readonly _desktops: Map<TDesktopId, Desktop> = new Map();
  private _selectedDesktopId: TDesktopId;
  private _whoInitiateRequireAttention: TTabId | null = null;
  public readonly prompts = new PromptsManager(this);

  constructor(
    public readonly browser: Browser,
    public readonly id: TWindowId,
    props?: IProps,
  ) {
    super(id, browser.eventsChannel, props?.bounds);

    registerWindowEvents(this);

    this._selectedDesktopId = props?.selectedDesktopId || 1;

    this.renderViews();
  }

  get desktops(): Desktop[] {
    return Array.from(this._desktops.values());
  }

  getDesktop(id: TDesktopId): Desktop | null {
    return this._desktops.get(id) || null;
  }

  get selectedDesktop(): Desktop {
    return this._desktops.get(this._selectedDesktopId)!;
  }

  selectDesktop(target: 'next' | 'prev' | TDesktopId): Desktop | null {
    const deskIds = Array.from(this._desktops.keys()).sort((a, b) => a - b);
    const currentIndex = deskIds.indexOf(this._selectedDesktopId);

    let newIndex: number;

    if (target === 'next') {
      newIndex = (currentIndex + 1) % deskIds.length;
    } else if (target === 'prev') {
      newIndex = (currentIndex - 1 + deskIds.length) % deskIds.length;
    } else {
      newIndex = deskIds.indexOf(target);
      if (newIndex === -1) {
        scopeLog.warn(`Attempted to go to invalid desktop ID: ${target}`);
        return null;
      }
    }

    this._selectedDesktopId = deskIds[newIndex];
    this.browser.eventsChannel.emit(
      'window:selected-desktop-did-change',
      this,
      this.selectedDesktop,
    );

    return this.selectedDesktop;
  }

  createDesktop(id: TDesktopId, props?: IDesktopProps): Desktop | null {
    if (this._desktops.size >= MAX_DESKTOPS) return null;
    const newDesktop = new Desktop(this.browser, this, id, props);
    this._desktops.set(id, newDesktop);
    this.browser.eventsChannel.emit('window:desktop-did-create', this, newDesktop);
    return newDesktop;
  }

  createDefaultDesktops() {
    for (let numDesktop = 0; numDesktop < MIN_DESKTOPS; numDesktop++) {
      this.createDesktop(numDesktop + 1);
    }
    scopeLog.info(`Created ${MIN_DESKTOPS} default desktops for window ${this.id}`);
  }

  closeDesktop(id: TDesktopId): boolean {
    if (this._desktops.size <= MIN_DESKTOPS) return false;

    const desktop = this._desktops.get(id);
    if (!desktop) return false;
    if (desktop.hasTabs) return false;

    let nextSelectedDesktop: Desktop | null = null;
    if (this._selectedDesktopId === id) {
      const ids = Array.from(this._desktops.keys()).sort((a, b) => a - b);
      const idx = ids.indexOf(id);
      const nextIdx = idx + 1 < ids.length ? idx + 1 : idx - 1;
      nextSelectedDesktop = this._desktops.get(ids[nextIdx])!;
    }

    this._desktops.delete(id);

    const allDesktops = Array.from(this._desktops.values()).sort((a, b) => a.id - b.id);
    this._desktops.clear();
    for (let i = 0; i < allDesktops.length; i++) {
      allDesktops[i].setId(i + 1);
      this._desktops.set(i + 1, allDesktops[i]);
    }

    if (nextSelectedDesktop) {
      this._selectedDesktopId = nextSelectedDesktop.id;
    }

    this.browser.eventsChannel.emit('window:desktop-did-remove', this);
    return true;
  }

  moveDesktop(id: TDesktopId, direction: 'left' | 'right') {
    const neighborId = direction === 'left' ? id - 1 : id + 1;

    const desktop = this._desktops.get(id);
    const neighbor = this._desktops.get(neighborId);

    if (!desktop || !neighbor) return;

    this._desktops.delete(id);
    this._desktops.delete(neighborId);

    desktop.setId(neighborId);
    neighbor.setId(id);

    // Rebuild map sorted by ID to preserve iteration order
    const allDesktops = Array.from(this._desktops.values());
    allDesktops.push(desktop, neighbor);
    allDesktops.sort((a, b) => a.id - b.id);
    this._desktops.clear();
    for (const d of allDesktops) {
      this._desktops.set(d.id, d);
    }

    if (this._selectedDesktopId === id) {
      this._selectedDesktopId = neighborId;
    } else if (this._selectedDesktopId === neighborId) {
      this._selectedDesktopId = id;
    }

    this.browser.eventsChannel.emit('window:desktops-order-did-change', this);
  }

  getTab(id: TTabId): IDesConTab | null {
    const tab = this.browser.getTab(id);
    if (!tab || tab.window.id !== this.id) {
      return null;
    }

    return {
      desktop: tab.desktop,
      tabContainer: tab.tabContainer,
      tab: tab.tab,
    };
  }

  getNextOrPreviousTabOfActiveDesktop(
    direction: 'next' | 'prev',
    opts?: ISelectTabProps,
  ): IDesConTab | null {
    const desktop = this.selectedDesktop;
    const tabContainer = desktop.selectedTabContainer;
    const sameDesktop = opts?.sameDesktop ?? false;
    const sequence = this._buildTabSequence(sameDesktop ? [desktop] : this.desktops);

    if (sequence.length === 0) {
      return null;
    }

    if (!tabContainer) {
      return sequence[direction === 'next' ? 0 : sequence.length - 1];
    }

    const selectedTab = tabContainer.selectedTab;
    const currentIndex = selectedTab
      ? sequence.findIndex(
          (c) => c.tab.id === selectedTab.id && c.tabContainer.id === tabContainer.id,
        )
      : -1;

    if (currentIndex === -1) {
      return sequence[direction === 'next' ? 0 : sequence.length - 1];
    }

    const newIndex =
      direction === 'next'
        ? (currentIndex + 1) % sequence.length
        : (currentIndex - 1 + sequence.length) % sequence.length;

    return sequence[newIndex] ?? null;
  }

  private _buildTabSequence(desktops: Desktop[]): IDesConTab[] {
    const result: IDesConTab[] = [];
    const walk = (desktop: Desktop, tc: TabContainer) => {
      for (const tab of tc.tabs) {
        if (tab.isClosed) continue;
        result.push({ desktop, tabContainer: tc, tab });
      }
      for (const child of tc.children) {
        walk(desktop, child);
      }
    };
    for (const desktop of desktops) {
      for (const tc of desktop.tabContainers) {
        walk(desktop, tc);
      }
    }
    return result;
  }

  openClosedTab(tabId: TTabId) {
    const tab = this.getTab(tabId);
    if (!tab) {
      scopeLog.warn(`No tab found with id: ${tabId}`);
      return;
    }

    tab.tab.resume();

    this.addView(tab.tab);

    this.selectTab(tab.tab.id);

    this.browser.eventsChannel.emit('window:tab-did-resume', this, tab.tab);
  }

  async selectTab(target: 'next' | 'prev' | TTabId, opts?: ISelectTabProps) {
    this.renderViews();

    if (target === 'next' || target === 'prev') {
      const conTab = this.getNextOrPreviousTabOfActiveDesktop(target, opts);
      if (conTab) {
        await this.selectTab(conTab.tab.id);
      }
      return;
    }

    const result = this.getTab(target);
    if (!result) {
      return;
    }

    const { desktop, tabContainer, tab } = result;

    this._selectedDesktopId = desktop.id;

    tabContainer.selectTab(tab.id);
    desktop.selectTabContainer(tabContainer.id);

    tab.updateLastAccessed();
    tab.setRequireAttention(false);

    if (tab.suspended) {
      tab.resume();

      this.addView(tab);
      this.renderViews();
      this.browser.eventsChannel.emit('window:selected-tab-did-change', this, tab);
      this.browser.eventsChannel.emit('window:tab-did-resume', this, tab);

      return;
    }

    this.renderViews();

    this.browser.eventsChannel.emit('window:selected-tab-did-change', this, tab);
  }

  get tabs(): IDesConTab[] {
    const allTabs: IDesConTab[] = [];
    for (const desktop of this._desktops.values()) {
      for (const tc of desktop.tabContainers) {
        for (const entry of tc.ownAndChildTabs) {
          allTabs.push({ desktop, ...entry });
        }
      }
    }
    return allTabs;
  }

  get hasTabsVisible(): boolean {
    const desktop = this.selectedDesktop;
    return (
      desktop &&
      desktop.selectedTabContainer !== null &&
      desktop.selectedTabContainer.selectedTab !== null
    );
  }

  get tabContainers(): IDesCon[] {
    const allContainers: IDesCon[] = [];
    for (const desktop of this._desktops.values()) {
      for (const tabContainer of desktop.tabContainers) {
        allContainers.push({ desktop, tabContainer });
      }
    }
    return allContainers;
  }

  removeAllTabViews(tabId: TTabId) {
    for (const view of this.views) {
      if (view.viewId.startsWith(`tab-${tabId}#`)) {
        view.closeWebContents();
        this.removeView(view.viewId);
      }
    }
  }

  async suspendTab(id: TTabId, props?: { emit?: boolean }): Promise<boolean> {
    const result = this.getTab(id);
    if (!result) {
      return false;
    }

    const { tabContainer, desktop, tab } = result;

    tab.saveHistory();
    tab.suspend();

    if (tabContainer.selectedTab?.id === tab.id) {
      tabContainer.selectTab(null);
    }

    if (desktop.selectedTabContainer?.id === tabContainer.id) {
      desktop.selectTabContainer(null);
    }

    tab.setVisible(false);
    tab.stopFindInPage();

    this.removeAllTabViews(tab.id);
    this.renderViews();

    this.browser.mediaManager.removeSession(id);

    scopeLog.debug(
      `Suspended tab ${id}. Total views in window: ${this.bw.contentView.children.length}`,
    );

    if (props?.emit ?? true) {
      this.browser.eventsChannel.emit('window:tab-did-suspend', this);
    }

    return true;
  }

  private get tabsOrderedByLastAccessed(): IDesConTab[] {
    const tabs = this.tabs.filter((t) => !t.tab.suspended && !t.tab.isClosed);
    tabs.sort((a, b) => b.tab.lastAccessed - a.tab.lastAccessed);
    return tabs;
  }

  getLastAccessedTab(props?: { desktop?: Desktop; ignore?: TTabId[] }): IDesConTab | null {
    let tabs = this.tabsOrderedByLastAccessed;
    const desktop = props?.desktop || null;
    const ignore = props?.ignore || null;

    if (desktop) {
      tabs = tabs.filter((conTab) => conTab.desktop.id === desktop.id);
    }

    if (ignore) {
      tabs = tabs.filter((t) => !ignore.includes(t.tab.id));
    }

    if (tabs.length === 0) {
      return null;
    }

    return tabs[0];
  }

  renderViews() {
    for (const view of this.views) {
      view.checkVisibility(this);
    }

    for (const view of this.views) {
      if (!view.visible && !['tab-switcher', 'tab-marks'].includes(view.viewId)) {
        continue;
      }
      view.refreshBounds(this);
    }
  }

  toggleSidebar(window: Window) {
    super.toggleSidebar(window);
    this.moveViewToTop('sidebar');
  }

  toggleMaximizeArea(window: Window) {
    super.toggleMaximizeArea(window);
  }

  get tabsRequireAttention(): IDesConTab[] {
    const tabs = this.tabs.filter((conTab) => conTab.tab.requireAttention);
    return tabs;
  }

  setFullScreen(fullScreen: boolean) {
    super.setFullScreen(fullScreen);
    this.renderViews();
  }

  get selectedTab(): IDesConTab | null {
    const desktop = this.selectedDesktop;
    const tabContainer = desktop.selectedTabContainer;
    const selectedTab = tabContainer?.selectedTab;

    if (desktop && tabContainer && selectedTab) {
      return { desktop, tabContainer, tab: selectedTab };
    }

    return null;
  }

  openContextualModal(page: TPage, params: IContextualModalParams) {
    this.modal.openContextual(page, params);
    this.browser.toRenderer.refreshSidebarDrag(this, false);
    this.renderViews();
  }

  closeContextualModal() {
    this.modal.closeContextual();
    this.browser.toRenderer.refreshSidebarDrag(this, true);
    this.renderViews();
  }

  get whoInitiateRequireAttention(): TTabId | null {
    return this._whoInitiateRequireAttention;
  }

  setWhoInitiateRequireAttention(id: TTabId | null) {
    this._whoInitiateRequireAttention = id;
  }
}
