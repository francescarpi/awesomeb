import { IConTab, TDesktopId, TTabContainerId, TTabId } from '~/types';
import { defaultTheme, Theme, Window, TabContainer, ITabContainerProps, Browser } from '@/core';
import { IProps } from './types';

export class Desktop {
  private _name: string | null = null;
  private _requireAttention: boolean = false;
  private _theme: Theme;

  private readonly _tabContainers: Map<TTabContainerId, TabContainer> = new Map();
  private _selectedTabContainerId: TTabContainerId | null = null;

  constructor(
    public readonly browser: Browser,
    public readonly window: Window,
    public readonly id: TDesktopId,
    props?: IProps,
  ) {
    this._theme = props?.theme || defaultTheme;
    this._name = props?.name || null;
  }

  setName(name: string) {
    if (name === this._name) {
      return;
    }

    this._name = name;

    this.browser.eventsChannel.emit('desktop:name-did-change', this.window, this);
  }

  get name(): string | null {
    return this._name;
  }

  get label(): string {
    return `${this.id}: ${this.name || 'Unnamed'}`;
  }

  get requireAttention(): boolean {
    return this._requireAttention;
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

  get tabContainers(): TabContainer[] {
    return Array.from(this._tabContainers.values());
  }

  addTabContainer(tabContainer: TabContainer) {
    this._tabContainers.set(tabContainer.id, tabContainer);
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
    this.addTabContainer(tabContainer);
    return tabContainer;
  }
}
