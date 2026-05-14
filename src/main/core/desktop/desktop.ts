import { IConTab, TDesktopId, TTabContainerId, TTabId } from '~/types';
import { defaultTheme, Theme, Window, TabContainer, ITabContainerProps, Browser } from '@/core';
import { IProps } from './types';

export class Desktop {
  private _name: string | null = null;
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
    this._name = props?.name || null;
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

  setName(name: string) {
    if (name === this._name) {
      return;
    }

    this._name = name.trim() === '' ? null : name;

    this.browser.eventsChannel.emit('desktop:name-did-change', this.window, this);
  }

  get name(): string | null {
    return this._name;
  }

  get label(): string {
    return `${this.id}: ${this.name || 'Unnamed'}`;
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

  closeTabContainer(id: TTabContainerId): boolean {
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
    const tabContainers = this.tabContainers;
    const index = tabContainers.findIndex((tc) => tc.id === id);
    if (index === -1) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tabContainers.length) {
      return;
    }

    const [movedTabContainer] = tabContainers.splice(index, 1);
    tabContainers.splice(newIndex, 0, movedTabContainer);

    // Update the internal map to reflect the new order
    this._tabContainers.clear();
    for (const tc of tabContainers) {
      this._tabContainers.set(tc.id, tc);
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
}
