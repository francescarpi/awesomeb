import { UIWindow } from '@/ui';
import type { IProps } from './types';
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

  getNextOrPreviousTabOfActiveDesktop(direction: 'next' | 'prev'): IDesConTab | null {
    const desktop = this.selectedDesktop;
    const tabContainer = desktop.selectedTabContainer;

    if (!tabContainer || !tabContainer.selectedTab) {
      return this._firstOrLastTabOfDesktop(desktop, direction);
    }

    const selectedTab = tabContainer.selectedTab;

    const nextTabInContainer =
      direction === 'next'
        ? tabContainer.getNextTab(selectedTab.id)
        : tabContainer.getPrevTab(selectedTab.id);
    if (nextTabInContainer) {
      return { desktop, tabContainer, tab: nextTabInContainer };
    }

    if (direction === 'next') {
      const childJump = this._firstTabOfChildOf(desktop, selectedTab.id);
      if (childJump) {
        return childJump;
      }
      const siblingJump = this._nextSiblingContainerOf(tabContainer, desktop);
      if (siblingJump) {
        return siblingJump;
      }
    } else {
      const parentJump = this._parentTabOf(tabContainer, desktop);
      if (parentJump) {
        return parentJump;
      }
      const siblingJump = this._prevSiblingContainerOf(tabContainer, desktop);
      if (siblingJump) {
        return siblingJump;
      }
    }

    return this._wrapAroundTopLevel(desktop, tabContainer, direction);
  }

  private _firstTabOfChildOf(desktop: Desktop, parentTabId: TTabId): IDesConTab | null {
    const childContainers = desktop.tabContainers.filter(
      (tc) =>
        tc.parentTab !== null &&
        tc.parentTab.id === parentTabId &&
        !tc.isClosed &&
        tc.tabs.length > 0,
    );
    if (childContainers.length === 0) {
      return null;
    }
    const firstChild = childContainers[0];
    return { desktop, tabContainer: firstChild, tab: firstChild.tabs[0] };
  }

  private _nextSiblingContainerOf(tabContainer: TabContainer, desktop: Desktop): IDesConTab | null {
    const parentTab = tabContainer.parentTab;
    if (parentTab === null) {
      return null;
    }
    const siblings = desktop.tabContainers.filter(
      (tc) =>
        tc.parentTab !== null &&
        tc.parentTab.id === parentTab.id &&
        !tc.isClosed &&
        tc.tabs.length > 0,
    );
    const currentIdx = siblings.findIndex((tc) => tc.id === tabContainer.id);
    if (currentIdx === -1 || currentIdx + 1 >= siblings.length) {
      return null;
    }
    const nextSibling = siblings[currentIdx + 1];
    return { desktop, tabContainer: nextSibling, tab: nextSibling.tabs[0] };
  }

  private _prevSiblingContainerOf(tabContainer: TabContainer, desktop: Desktop): IDesConTab | null {
    const parentTab = tabContainer.parentTab;
    if (parentTab === null) {
      return null;
    }
    const siblings = desktop.tabContainers.filter(
      (tc) =>
        tc.parentTab !== null &&
        tc.parentTab.id === parentTab.id &&
        !tc.isClosed &&
        tc.tabs.length > 0,
    );
    const currentIdx = siblings.findIndex((tc) => tc.id === tabContainer.id);
    if (currentIdx <= 0) {
      return null;
    }
    const prevSibling = siblings[currentIdx - 1];
    return {
      desktop,
      tabContainer: prevSibling,
      tab: prevSibling.tabs[prevSibling.tabs.length - 1],
    };
  }

  private _parentTabOf(tabContainer: TabContainer, desktop: Desktop): IDesConTab | null {
    const parentTab = tabContainer.parentTab;
    if (parentTab === null) {
      return null;
    }
    for (const tc of desktop.tabContainers) {
      const t = tc.getTab(parentTab.id);
      if (t) {
        return { desktop, tabContainer: tc, tab: t };
      }
    }
    return null;
  }

  private _wrapAroundTopLevel(
    desktop: Desktop,
    tabContainer: TabContainer,
    direction: 'next' | 'prev',
  ): IDesConTab | null {
    const topLevelContainers = desktop.tabContainers.filter(
      (tc) => tc.parentTab === null && !tc.isClosed && tc.tabs.length > 0,
    );
    if (topLevelContainers.length === 0) {
      return null;
    }

    let contextTc: TabContainer | null = tabContainer;
    while (contextTc.parentTab !== null) {
      const parentId = contextTc.parentTab.id;
      let found: TabContainer | null = null;
      for (const tc of desktop.tabContainers) {
        if (tc.tabs.some((t) => t.id === parentId)) {
          found = tc;
          break;
        }
      }
      if (found === null) {
        break;
      }
      contextTc = found;
    }

    const currentIdx = topLevelContainers.findIndex((tc) => tc.id === contextTc!.id);
    if (currentIdx === -1) {
      return null;
    }

    const step = direction === 'next' ? 1 : -1;
    for (let i = 1; i <= topLevelContainers.length; i++) {
      const idx = (currentIdx + step * i + topLevelContainers.length) % topLevelContainers.length;
      const candidate = topLevelContainers[idx];
      const targetTab =
        direction === 'next' ? candidate.tabs[0] : candidate.tabs[candidate.tabs.length - 1];
      if (targetTab) {
        return { desktop, tabContainer: candidate, tab: targetTab };
      }
    }
    return null;
  }

  private _firstOrLastTabOfDesktop(
    desktop: Desktop,
    direction: 'next' | 'prev',
  ): IDesConTab | null {
    const containers = desktop.tabContainers.filter(
      (tc) => tc.parentTab === null && !tc.isClosed && tc.tabs.length > 0,
    );
    if (containers.length === 0) {
      return null;
    }
    const targetContainer =
      direction === 'next' ? containers[0] : containers[containers.length - 1];
    const targetTab =
      direction === 'next'
        ? targetContainer.tabs[0]
        : targetContainer.tabs[targetContainer.tabs.length - 1];
    if (!targetTab) {
      return null;
    }
    return { desktop, tabContainer: targetContainer, tab: targetTab };
  }

  openClosedTab(tabId: TTabId) {
    const tab = this.getTab(tabId);
    if (!tab) {
      scopeLog.warn(`No tab found with id: ${tabId}`);
      return;
    }

    tab.tab.resume();
    tab.tabContainer.includeTabInOrder(tab.tab.id);
    if (!tab.tabContainer.isClosed) {
      tab.desktop.includeTabContainerInOrder(tab.tabContainer.id);
    }

    this.addView(tab.tab);

    this.selectTab(tab.tab.id);

    this.browser.eventsChannel.emit('window:tab-did-resume', this, tab.tab);
  }

  async selectTab(target: 'next' | 'prev' | TTabId) {
    this.renderViews();

    if (target === 'next' || target === 'prev') {
      const conTab = this.getNextOrPreviousTabOfActiveDesktop(target);
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
      for (const tabContainer of desktop.tabContainers) {
        for (const tab of tabContainer.tabs) {
          allTabs.push({ desktop, tabContainer, tab });
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
