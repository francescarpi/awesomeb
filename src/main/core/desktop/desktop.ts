import { IConTab, TDesktopId, TTabContainerId, TTabId } from '~/types';
import { defaultTheme, Theme, Window, TabContainer, ITabContainerProps, Browser } from '@/core';
import { IProps } from './types';

export class Desktop {
  private _shortName: string | null = null;
  private _longName: string | null = null;
  private _theme: Theme;
  private _id: TDesktopId;

  private readonly _tabContainers: Map<TTabContainerId, TabContainer> = new Map();
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

  // setName treats both fields as a single unit: if either is empty
  // (after trim), both reset to null. This is intentional UX — when
  // the user clears one input in the rename modal, both names go.
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
    return Array.from(this._tabContainers.values());
  }

  addTabContainer(tabContainer: TabContainer, justAfter?: TTabContainerId) {
    if (justAfter && this._tabContainers.has(justAfter)) {
      const tabContainers = this.tabContainers;
      const index = tabContainers.findIndex((tc) => tc.id === justAfter);
      if (index !== -1) {
        tabContainers.splice(index + 1, 0, tabContainer);
        // Update the internal map to reflect the new order
        this._tabContainers.clear();
        for (const tc of tabContainers) {
          this._tabContainers.set(tc.id, tc);
        }
        return;
      }
    } else {
      this._tabContainers.set(tabContainer.id, tabContainer);
    }
  }

  selectTabContainer(id: TTabContainerId | null) {
    if (id === null) {
      this._selectedTabContainerId = null;
      return;
    }

    if (!this._findTabContainer(id)) {
      return;
    }

    this._selectedTabContainerId = id;
  }

  get selectedTabContainer(): TabContainer | null {
    if (this._selectedTabContainerId === null) {
      return null;
    }
    return this._findTabContainer(this._selectedTabContainerId);
  }

  private _findTabContainer(id: TTabContainerId): TabContainer | null {
    const walk = (tc: TabContainer): TabContainer | null => {
      if (tc.id === id) {
        return tc;
      }
      for (const child of tc.children) {
        const found = walk(child);
        if (found) {
          return found;
        }
      }
      return null;
    };

    for (const top of this._tabContainers.values()) {
      const found = walk(top);
      if (found) {
        return found;
      }
    }

    return null;
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
    for (const tc of this._tabContainers.values()) {
      tabs.push(...tc.ownAndChildTabs);
    }
    return tabs;
  }

  moveTabContainer(id: TTabContainerId, direction: 'up' | 'down') {
    const tc = this._findTabContainer(id);
    if (!tc) return;

    const moved = tc.parent
      ? tc.parent.moveChild(id, direction)
      : this._moveTopLevelTabContainer(id, direction);

    if (moved) {
      this.browser.eventsChannel.emit('desktop:tabcontainers-order-did-change', this.window, this);
    }
  }

  private _moveTopLevelTabContainer(id: TTabContainerId, direction: 'up' | 'down'): boolean {
    const tabContainers = this.tabContainers;
    const index = tabContainers.findIndex((tc) => tc.id === id);
    if (index === -1) return false;

    const step = direction === 'up' ? -1 : 1;
    let newIndex = index + step;
    while (newIndex >= 0 && newIndex < tabContainers.length && tabContainers[newIndex].isClosed) {
      newIndex += step;
    }

    if (newIndex < 0 || newIndex >= tabContainers.length) return false;
    if (newIndex === index) return false;

    const [movedTabContainer] = tabContainers.splice(index, 1);
    tabContainers.splice(newIndex, 0, movedTabContainer);

    this._tabContainers.clear();
    for (const tc of tabContainers) {
      this._tabContainers.set(tc.id, tc);
    }

    return true;
  }

  getTabsBelow(tabId: TTabId): IConTab[] {
    const tabsBelow: IConTab[] = [];
    let found = false;
    for (const tc of this.tabContainers) {
      for (const entry of tc.ownAndChildTabs) {
        if (entry.tab.id === tabId) {
          found = true;
          continue;
        }
        if (found) {
          tabsBelow.push(entry);
        }
      }
    }
    return tabsBelow;
  }

  getTabContainerByIndex(idx: number): TabContainer | null {
    const tabContainers = this.tabContainers;
    const openTabContainers = tabContainers.filter((tc) => !tc.isClosed);

    if (idx < 0 || idx >= openTabContainers.length) {
      return null;
    }
    return openTabContainers[idx];
  }
}
