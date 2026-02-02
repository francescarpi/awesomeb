import { UIWindow } from '@/ui';
import type { IProps } from './types';
import { Desktop, IDesktopProps } from '@/core';
import EventEmitter from 'events';
import { MIN_DESKTOPS } from './constants';
import { IDesConTab, TDesktopId, TTabId } from '~/types';
import log from 'electron-log';
import { registerWindowEvents } from './events';
// import { TViewId } from '@/ui/types';

const scopeLog = log.scope('Window');

export class Window extends UIWindow {
  private readonly _desktops: Map<TDesktopId, Desktop> = new Map();
  private _selectedDesktopId: number;

  constructor(
    public readonly eventsChannel: EventEmitter,
    props?: IProps,
  ) {
    super(eventsChannel, props?.bounds);

    registerWindowEvents(this);

    this._selectedDesktopId = props?.selectedDesktopId || 1;
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
    this.eventsChannel.emit('window:selected-desktop-did-change', this, this.selectedDesktop);

    return this.selectedDesktop;
  }

  createDesktop(id: TDesktopId, props?: IDesktopProps): Desktop {
    const newDesktop = new Desktop(this.eventsChannel, this, id, props);
    this._desktops.set(id, newDesktop);
    return newDesktop;
  }

  createDefaultDesktops() {
    for (let numDesktop = 0; numDesktop < MIN_DESKTOPS; numDesktop++) {
      this.createDesktop(numDesktop + 1);
    }
  }

  refreshVisibleTabView() {
    // const visible: TViewId[] = [];
    const desktop = this.selectedDesktop;
    const tabContainer = desktop.selectedTabContainer;

    if (tabContainer) {
      this.setNoTabVisibility(false);
      // this.addIntoMainLayout(tabContainer.layout);
      // for (const tab of tabContainer.tabs) {
      //   visible.push(tab.view.id);
      // }
    } else {
      this.setNoTabVisibility(true);
    }

    this.renderLayout();

    // this.refreshTabContainerLayoutView(visible);
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

  getNextOrPreviousTabOfActiveDesktop(direction: 'next' | 'prev'): IDesConTab | null {
    const desktop = this.selectedDesktop;
    const tabContainer = desktop.selectedTabContainer;

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

    const selectedTab = tabContainer.selectedTab!;
    const allTabs = this.getAllTabs();
    const currentIndex = allTabs.findIndex(
      (conTab) => conTab.tab.id === selectedTab.id && conTab.tabContainer.id === tabContainer.id,
    );

    let newIndex: number;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allTabs.length;
    } else {
      newIndex = (currentIndex - 1 + allTabs.length) % allTabs.length;
    }

    const result = allTabs[newIndex];
    if (result) {
      return result;
    }

    return null;
  }

  async selectTab(target: 'next' | 'prev' | TTabId) {
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

    // If exist previous selected tab, we have to remove it from the browser window
    const selectedTabContainer = this.selectedDesktop.selectedTabContainer;
    if (selectedTabContainer) {
      this.removeFromMainLayout(selectedTabContainer.layout);
    }

    const { desktop, tabContainer, tab } = result;

    this.addIntoMainLayout(tabContainer.layout);

    this._selectedDesktopId = desktop.id;

    tabContainer.selectTab(tab.id);
    desktop.selectTabContainer(tabContainer.id);

    this.refreshVisibleTabView();

    if (tab.suspended) {
      tab.resume();

      this.eventsChannel.emit('window:selected-tab-did-change', this, tab);

      await tab.loadHistoryOrURL();
    } else {
      this.eventsChannel.emit('window:selected-tab-did-change', this, tab);
    }

    // If tab wasn't suspended, we don't have to add the layout into the window
    if (tab.view.isDestroyed) {
      this.eventsChannel.emit('window:selected-tab-did-change', this, tab);
      return;
    }

    tab.updateLastAccessed();

    this.refreshVisibleTabView();
  }

  getAllTabs(): IDesConTab[] {
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

  async suspendTab(id: TTabId): Promise<boolean> {
    const result = this.getTab(id);
    if (!result) {
      return false;
    }

    const { tabContainer, desktop } = result;

    // TODO we have to save the history on disk before suspending

    // TODO to think about suspend/or not, all tabs in the container
    for (const tab of tabContainer.tabs) {
      tab.suspend();
    }

    tabContainer.selectTab(null);

    if (desktop.selectedTabContainer?.id === tabContainer.id) {
      desktop.selectTabContainer(null);
    }

    this.removeFromMainLayout(tabContainer.layout);
    this.refreshVisibleTabView();

    scopeLog.debug(
      `Suspended tab ${id}. Total views in window: ${this.bw.contentView.children.length}`,
    );

    this.eventsChannel.emit('window:tab-did-suspend', this);

    return true;
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

    const { tabContainer, desktop, tab } = result;

    tabContainer.closeTab(tab.id);

    if (tabContainer.tabs.length === 0) {
      desktop.closeTabContainer(tabContainer.id);
      if (desktop.selectedTabContainer?.id === tabContainer.id) {
        desktop.selectTabContainer(null);
      }
      this.removeFromMainLayout(tabContainer.layout);
    }

    this.refreshVisibleTabView();

    this.eventsChannel.emit('window:tab-did-close', this);

    return true;
  }

  getLastAccessedTab(desktop?: Desktop): IDesConTab | null {
    const allTabs = this.getAllTabs();
    if (allTabs.length === 0) {
      return null;
    }

    let filteredTabs = allTabs.filter((t) => !t.tab.suspended);
    if (desktop) {
      filteredTabs = filteredTabs.filter((conTab) => conTab.desktop.id === desktop.id);
    }

    if (filteredTabs.length === 0) {
      return null;
    }

    filteredTabs.sort((a, b) => b.tab.lastAccessed - a.tab.lastAccessed);

    return filteredTabs[0];
  }
}
