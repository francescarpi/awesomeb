import { IConTab, TDesktopId, TTabContainerId, TTabId } from '~/types';
import {
  defaultTheme,
  Theme,
  Window,
  TabContainer,
  ITabContainerProps,
  Browser,
  OrderIndex,
} from '@/core';
import { IProps } from './types';

export class Desktop {
  private _shortName: string | null = null;
  private _longName: string | null = null;
  private _theme: Theme;
  private _id: TDesktopId;

  private readonly _tabContainers: Map<TTabContainerId, TabContainer> = new Map();
  private _tabContainerOrder: OrderIndex<TTabContainerId> = new OrderIndex<TTabContainerId>();
  private _selectedTabContainerId: TTabContainerId | null = null;

  constructor(
    public readonly browser: Browser,
    public readonly window: Window,
    id: TDesktopId,
    props?: IProps,
  ) {
    this._id = id;
    this._theme = props?.theme || defaultTheme;
    this._shortName = props?.shortName || null;
    this._longName = props?.longName || null;
  }

  get id(): TDesktopId {
    return this._id;
  }

  setId(newId: TDesktopId) {
    if (newId === this._id) {
      return;
    }

    this._id = newId;
  }

  setName(shortName: string, longName: string) {
    if (shortName === this._shortName && longName === this._longName) {
      return;
    }

    const sanitizedShortName = shortName.trim();
    const sanitizedLongName = longName.trim();

    if (sanitizedShortName === '' || sanitizedLongName === '') {
      this._shortName = null;
      this._longName = null;
    } else {
      this._shortName = sanitizedShortName;
      this._longName = sanitizedLongName;
    }

    this.browser.eventsChannel.emit('desktop:name-did-change', this.window, this);
  }

  get shortName(): string | null {
    return this._shortName;
  }

  get longName(): string | null {
    return this._longName;
  }

  get label(): string {
    return `${this.id}: ${this.longName || 'Unnamed'}`;
  }

  get requireAttention(): boolean {
    for (const tabContainer of this._tabContainers.values()) {
      for (const tab of tabContainer.tabs) {
        if (tab.requireAttention) {
          return true;
        }
      }
    }
    return false;
  }

  get hasTabs(): boolean {
    return this._tabContainers.size > 0;
  }

  get hasActiveTabs(): boolean {
    for (const tabContainer of this._tabContainers.values()) {
      for (const tab of tabContainer.tabs) {
        if (!tab.suspended) {
          return true;
        }
      }
    }
    return false;
  }

  get theme(): Theme {
    return this._theme;
  }

  setTheme(theme: Theme) {
    if (theme.name === this._theme.name) {
      return;
    }

    this._theme = theme;
    this.browser.eventsChannel.emit('desktop:theme-did-change', this.window, this);
  }

  updateTheme(theme: Theme) {
    this._theme = theme;
    this.browser.eventsChannel.emit('desktop:theme-did-change', this.window, this);
  }

  get tabContainers(): TabContainer[] {
    return this._tabContainerOrder
      .toArray({ includeExcluded: true })
      .map((id) => this._tabContainers.get(id)!);
  }

  addTabContainer(tabContainer: TabContainer, justAfter?: TTabContainerId) {
    this._tabContainers.set(tabContainer.id, tabContainer);
    this._tabContainerOrder.add(tabContainer.id, justAfter);
  }

  selectTabContainer(id: TTabContainerId | null) {
    if (id === null) {
      this._selectedTabContainerId = null;
      return;
    }

    if (!this._tabContainers.has(id)) {
      return;
    }

    this._selectedTabContainerId = id;
  }

  get selectedTabContainer(): TabContainer | null {
    if (this._selectedTabContainerId === null) {
      return null;
    }
    return this._tabContainers.get(this._selectedTabContainerId) || null;
  }

  get selectedTab(): IConTab | null {
    const tabContainer = this.selectedTabContainer;
    if (!tabContainer) {
      return null;
    }
    const tab = tabContainer.selectedTab;
    if (!tab) {
      return null;
    }
    return {
      tabContainer,
      tab,
    };
  }

  getTab(id: TTabId): IConTab | null {
    for (const tabContainer of this._tabContainers.values()) {
      const tab = tabContainer.getTab(id);
      if (tab) {
        return {
          tabContainer,
          tab,
        };
      }
    }
    return null;
  }

  deleteTabContainer(id: TTabContainerId): boolean {
    const tabContainer = this._tabContainers.get(id);
    if (!tabContainer) {
      return false;
    }

    this._tabContainers.delete(id);
    this._tabContainerOrder.remove(id);

    if (this._selectedTabContainerId === id) {
      this._selectedTabContainerId = null;
    }

    return true;
  }

  createTabContainer(id: TTabContainerId, props?: ITabContainerProps): TabContainer {
    const tabContainer = new TabContainer(this.browser, id, props);
    this.addTabContainer(tabContainer, props?.justAfter);
    return tabContainer;
  }

  get tabs(): IConTab[] {
    const tabs: IConTab[] = [];
    for (const tabContainer of this._tabContainers.values()) {
      for (const tab of tabContainer.tabs) {
        tabs.push({
          tabContainer,
          tab,
        });
      }
    }
    return tabs;
  }

  moveTabContainer(id: TTabContainerId, direction: 'up' | 'down') {
    const tc = this._tabContainers.get(id);
    if (!tc) {
      return;
    }

    if (tc.parentTab === null) {
      this._tabContainerOrder.move(id, direction, { skipExcluded: true });
    } else {
      const parentId = tc.parentTab.id;
      const siblings = this.tabContainers.filter(
        (other) => other.parentTab !== null && other.parentTab.id === parentId,
      );
      const currentIdx = siblings.findIndex((s) => s.id === id);
      if (currentIdx === -1) {
        return;
      }
      const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
      if (targetIdx < 0 || targetIdx >= siblings.length) {
        return;
      }
      const target = siblings[targetIdx];
      if (direction === 'up') {
        this._tabContainerOrder.moveBefore(id, target.id);
      } else {
        this._tabContainerOrder.moveAfter(id, target.id);
      }
    }

    this.browser.eventsChannel.emit('desktop:tabcontainers-order-did-change', this.window, this);
  }

  getTabsBelow(tabId: TTabId): IConTab[] {
    const tabsBelow: IConTab[] = [];
    let found = false;
    for (const tc of this.tabContainers) {
      for (const t of tc.tabs) {
        if (t.id === tabId) {
          found = true;
          continue;
        }
        if (found) {
          tabsBelow.push({
            tabContainer: tc,
            tab: t,
          });
        }
      }
    }
    return tabsBelow;
  }

  getTabContainerByIndex(idx: number): TabContainer | null {
    const topLevelOpenContainers = this.tabContainers.filter(
      (tc) => tc.parentTab === null && !tc.isClosed,
    );

    if (idx < 0 || idx >= topLevelOpenContainers.length) {
      return null;
    }
    return topLevelOpenContainers[idx];
  }

  getNextTabContainer(id: TTabContainerId): TabContainer | null {
    const nextId = this._tabContainerOrder.getNext(id, { skipExcluded: true });
    return nextId !== null ? this._tabContainers.get(nextId) || null : null;
  }

  getPrevTabContainer(id: TTabContainerId): TabContainer | null {
    const prevId = this._tabContainerOrder.getPrev(id, { skipExcluded: true });
    return prevId !== null ? this._tabContainers.get(prevId) || null : null;
  }

  excludeTabContainerFromOrder(id: TTabContainerId): void {
    this._tabContainerOrder.exclude(id);
  }

  includeTabContainerInOrder(id: TTabContainerId): void {
    this._tabContainerOrder.include(id);
  }
}
