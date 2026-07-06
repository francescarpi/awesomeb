import { TTabContainerId, TTabId } from '~/types';
import { Tab } from './tab';
import { ITabContainerProps, ITabProps } from './types';
import { Browser, OrderIndex } from '@/core';
import { Layouts, LayoutBase } from './layouts';

export class TabContainer {
  private _divider: boolean;
  private readonly _tabs: Map<TTabId, Tab> = new Map();
  private _tabOrder: OrderIndex<TTabId> = new OrderIndex<TTabId>();
  private _selectedTabId: TTabId | null = null;
  private _layout: LayoutBase = Layouts['vertical'];
  private _layoutSize: number = 50;
  private _parentTab: Tab | null = null;

  constructor(
    public readonly browser: Browser,
    public readonly id: TTabContainerId,
    props?: ITabContainerProps,
  ) {
    this._divider = props?.divider ?? false;
  }

  get tabs(): Tab[] {
    return this._tabOrder.toArray({ includeExcluded: true }).map((tabId) => this._tabs.get(tabId)!);
  }

  createTab(id: TTabId, props: ITabProps): Tab {
    const tab = new Tab(this.browser, id, props);

    this.addTab(tab);

    return tab;
  }

  addTab(tab: Tab, justAfter?: TTabId) {
    this._tabs.set(tab.id, tab);
    this._tabOrder.add(tab.id, justAfter);
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
    this._tabOrder.remove(id);

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

    const orderArray = this._tabOrder.toArray({ includeExcluded: true });
    const rotated = clockwise
      ? [orderArray[orderArray.length - 1], ...orderArray.slice(0, orderArray.length - 1)]
      : [...orderArray.slice(1), orderArray[0]];

    this._tabOrder.clear();
    for (const tabId of rotated) {
      this._tabOrder.add(tabId);
    }

    this.browser.eventsChannel.emit('tabcontainer:tabs-rotated', this);
  }

  popTab(): Tab | null {
    const orderArray = this._tabOrder.toArray({ includeExcluded: true });
    if (orderArray.length === 0) {
      return null;
    }
    const poppedTabId = orderArray[orderArray.length - 1];
    const poppedTab = this._tabs.get(poppedTabId) || null;
    this._tabOrder.remove(poppedTabId);
    this._tabs.delete(poppedTabId);
    if (this._selectedTabId === poppedTabId) {
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
    const all = this.tabs;
    return all.length > 0 && all.every((tab) => tab.isClosed);
  }

  getVisibleTabPosition(tabId: TTabId): number {
    const visible = this.visibleTabs;
    return visible.findIndex((tab) => tab.id === tabId) + 1;
  }

  get parentTab(): Tab | null {
    return this._parentTab;
  }

  setParentTab(parent: Tab | null) {
    this._parentTab = parent;
  }

  getNextTab(id: TTabId): Tab | null {
    const nextId = this._tabOrder.getNext(id, { skipExcluded: true });
    return nextId !== null ? this._tabs.get(nextId) || null : null;
  }

  getPrevTab(id: TTabId): Tab | null {
    const prevId = this._tabOrder.getPrev(id, { skipExcluded: true });
    return prevId !== null ? this._tabs.get(prevId) || null : null;
  }

  excludeTabFromOrder(id: TTabId): void {
    this._tabOrder.exclude(id);
  }

  includeTabInOrder(id: TTabId): void {
    this._tabOrder.include(id);
  }
}
