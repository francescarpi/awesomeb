import { TTabContainerId, TTabId } from '~/types';
import { Tab } from './tab';
import { ITabContainerProps, ITabProps } from './types';
import { Browser } from '@/core';
import { Layouts, LayoutBase } from './layouts';

export class TabContainer {
  private _divider: boolean;
  private readonly _tabs: Map<TTabId, Tab> = new Map();
  private _selectedTabId: TTabId | null = null;
  private _layout: LayoutBase = Layouts['vertical'];
  private _layoutSize: number = 50;

  private readonly _children: Map<TTabContainerId, TabContainer> = new Map();
  private _parent: TabContainer | null = null;

  constructor(
    public readonly browser: Browser,
    public readonly id: TTabContainerId,
    props?: ITabContainerProps,
  ) {
    this._divider = props?.divider ?? false;
  }

  get tabs(): Tab[] {
    return Array.from(this._tabs.values());
  }

  createTab(id: TTabId, props: ITabProps): Tab {
    const tab = new Tab(this.browser, id, props);

    this.addTab(tab);

    return tab;
  }

  addTab(tab: Tab) {
    this._tabs.set(tab.id, tab);
  }

  get divider(): boolean {
    return this._divider;
  }

  setDivider(divider: boolean) {
    if (this._divider === divider) {
      return;
    }
    this._divider = divider;
    this.browser.eventsChannel.emit('tabcontainer:divider-did-change', this);
  }

  get selectedTab(): Tab | null {
    if (this._selectedTabId === null) {
      return null;
    }
    return this._tabs.get(this._selectedTabId) || null;
  }

  getTab(id: TTabId): Tab | null {
    return this._tabs.get(id) || null;
  }

  selectTab(id: TTabId | null): Tab | null {
    if (id === null) {
      this._selectedTabId = null;
      return null;
    }

    if (this._selectedTabId === id) {
      return this._tabs.get(id) || null;
    }

    const tab = this._tabs.get(id) || null;
    if (tab) {
      this._selectedTabId = id;
    }

    return tab;
  }

  deleteTab(id: TTabId): boolean {
    const tab = this._tabs.get(id);
    if (!tab) {
      return false;
    }

    this._tabs.delete(id);

    if (this._selectedTabId === id) {
      this._selectedTabId = null;
    }

    return true;
  }

  get layout(): LayoutBase {
    return this._layout;
  }

  get visibleTabs(): Tab[] {
    return this.tabs.filter((t) => t.visible && !t.isClosed);
  }

  get isSplit(): boolean {
    return this.visibleTabs.length > 1;
  }

  get hasSplitTabs(): boolean {
    return this.tabs.filter((t) => !t.isClosed).length > 1;
  }

  setLayout(layout: LayoutBase) {
    if (this._layout.id === layout.id) {
      return;
    }
    this._layout = layout;
    this.browser.eventsChannel.emit('tabcontainer:layout-did-change', this);
  }

  rotateTabs(clockwise: boolean) {
    if (this.tabs.length <= 1) {
      return;
    }

    const tabsArray = this.tabs;
    const rotatedTabs = clockwise
      ? [tabsArray[tabsArray.length - 1], ...tabsArray.slice(0, tabsArray.length - 1)]
      : [...tabsArray.slice(1), tabsArray[0]];

    // Update the order of tabs in the container
    this._tabs.clear();
    for (const tab of rotatedTabs) {
      this._tabs.set(tab.id, tab);
    }

    this.browser.eventsChannel.emit('tabcontainer:tabs-rotated', this);
  }

  popTab(): Tab | null {
    const tabsArray = this.tabs;
    if (tabsArray.length === 0) {
      return null;
    }
    const poppedTab = tabsArray[tabsArray.length - 1];
    this._tabs.delete(poppedTab.id);
    if (this._selectedTabId === poppedTab.id) {
      this._selectedTabId = null;
    }
    return poppedTab;
  }

  get layoutSize(): number {
    return this._layoutSize;
  }

  setLayoutSize(size: number) {
    if (this._layoutSize === size) {
      return;
    }
    this._layoutSize = size;
    this.browser.eventsChannel.emit('tabcontainer:layout-size-did-change', this);
  }

  get firstSuspendedTab(): Tab | null {
    for (const tab of this.tabs) {
      if (tab.suspended) {
        return tab;
      }
    }
    return null;
  }

  get isClosed(): boolean {
    return this.tabs.length > 0 && this.tabs.every((tab) => tab.isClosed);
  }

  getVisibleTabPosition(tabId: TTabId): number {
    const tabsArray = this.visibleTabs;
    return tabsArray.findIndex((tab) => tab.id === tabId) + 1;
  }

  get children(): TabContainer[] {
    return Array.from(this._children.values());
  }

  removeChild(tabContainerId: TTabContainerId) {
    this._children.delete(tabContainerId);
  }

  addChild(tabContainer: TabContainer) {
    this._children.set(tabContainer.id, tabContainer);
  }

  createChildTabContainer(id: TTabContainerId, props?: ITabContainerProps): TabContainer {
    const tabContainer = new TabContainer(this.browser, id, props);
    tabContainer.setParent(this);
    this.addChild(tabContainer);
    return tabContainer;
  }

  setParent(tabContainer: TabContainer | null) {
    this._parent = tabContainer;
  }

  get parent(): TabContainer | null {
    return this._parent;
  }
}
