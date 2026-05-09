import { UIWindow } from '@/ui';
import type { IProps, ISelectTabProps } from './types';
import { Desktop, IDesktopProps, Browser, PromptsManager, openURLHistory } from '@/core';
import { MIN_DESKTOPS } from './constants';
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
  private readonly _visibleDesktopsRange: [number, number] = [1, MIN_DESKTOPS];
  private _selectedDesktopId: TDesktopId;
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

  get visibleDesktops(): Desktop[] {
    const [min, max] = this._visibleDesktopsRange;
    return this.desktops.filter((d) => d.id >= min && d.id <= max);
  }

  get hasLessDesktops(): boolean {
    const [min] = this._visibleDesktopsRange;
    return min > 1;
  }

  get hasMoreDesktops(): boolean {
    const [, max] = this._visibleDesktopsRange;
    return max < this.desktops.length;
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

  createDesktop(id: TDesktopId, props?: IDesktopProps): Desktop {
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
    for (const desktop of this._desktops.values()) {
      const conTab = desktop.getTab(id);
      if (conTab) {
        return {
          desktop,
          tabContainer: conTab.tabContainer,
          tab: conTab.tab,
        };
      }
    }
    return null;
  }

  getNextOrPreviousTabOfActiveDesktop(
    direction: 'next' | 'prev',
    opts?: ISelectTabProps,
  ): IDesConTab | null {
    const desktop = this.selectedDesktop;
    const tabContainer = desktop.selectedTabContainer;
    const sameDesktop = opts?.sameDesktop ?? false;

    if (!tabContainer) {
      if (direction === 'next') {
        const firstTab = desktop.tabContainers[0]?.tabs[0];
        return firstTab ? { desktop, tabContainer: desktop.tabContainers[0], tab: firstTab } : null;
      } else {
        const lastTabContainer = desktop.tabContainers[desktop.tabContainers.length - 1];
        const lastTab = lastTabContainer?.tabs[lastTabContainer.tabs.length - 1];
        return lastTab ? { desktop, tabContainer: lastTabContainer, tab: lastTab } : null;
      }
    }

    const selectedTab = tabContainer.selectedTab;
    const tabs = sameDesktop ? desktop.tabs.map((t) => ({ ...t, desktop })) : this.tabs;
    const currentIndex = tabs.findIndex(
      (conTab) => conTab.tab.id === selectedTab?.id && conTab.tabContainer.id === tabContainer.id,
    );

    let newIndex: number;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % tabs.length;
    } else {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    const result = tabs[newIndex];
    if (result) {
      return result;
    }

    return null;
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

      if (!tab.partition.private && tab.url) {
        openURLHistory.add(tab.url);
      }

      return;
    }

    this.renderViews();

    this.browser.eventsChannel.emit('window:selected-tab-did-change', this, tab);

    tab.focus();
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

  async suspendTab(id: TTabId): Promise<boolean> {
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
    this.removeView(tab.viewId);
    this.renderViews();

    scopeLog.debug(
      `Suspended tab ${id}. Total views in window: ${this.bw.contentView.children.length}`,
    );

    this.browser.eventsChannel.emit('window:tab-did-suspend', this);

    return true;
  }

  get tabsOrderedByLastAccessed(): IDesConTab[] {
    const tabs = this.tabs.filter((t) => !t.tab.suspended);
    tabs.sort((a, b) => b.tab.lastAccessed - a.tab.lastAccessed);
    return tabs;
  }

  getLastAccessedTab(desktop?: Desktop): IDesConTab | null {
    let tabs = this.tabsOrderedByLastAccessed;

    if (desktop) {
      tabs = tabs.filter((conTab) => conTab.desktop.id === desktop.id);
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
      if (!view.visible) {
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
}
