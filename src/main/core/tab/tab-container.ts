import { TTabContainerId, TTabId } from '~/types';
import { Tab } from './tab';
import { ITabContainerProps, ITabProps } from './types';
import { Browser } from '@/core';

export class TabContainer {
  private _divider: boolean;

  private readonly _tabs: Map<TTabId, Tab> = new Map();
  private _selectedTabId: TTabId | null = null;

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

    this._tabs.set(tab.id, tab);

    return tab;
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

  closeTab(id: TTabId): boolean {
    const tab = this._tabs.get(id);
    if (!tab) {
      return false;
    }

    this._tabs.delete(id);

    if (this._selectedTabId === id) {
      this._selectedTabId = null;
    }

    tab.close();

    return true;
  }

  setTabsVisibility(visible: boolean) {
    for (const tab of this._tabs.values()) {
      tab.view.setVisible(visible);

      if (visible) {
        if (tab.findInPage) {
          tab.findInPage.view.setVisible(true);
        }
        if (tab.failLoad) {
          tab.failLoad.setVisible(true);
        }
      } else {
        if (tab.findInPage) {
          tab.findInPage.view.setVisible(false);
        }
        if (tab.failLoad) {
          tab.failLoad.setVisible(false);
        }
      }
    }
  }
}
