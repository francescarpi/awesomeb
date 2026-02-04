import { TTabContainerId, TTabId } from '~/types';
import { Tab } from './tab';
import EventEmitter from 'events';
import { ITabContainerProps, ITabProps } from './types';
import { UILayout } from '@/ui';

export class TabContainer {
  private _divider: boolean;
  private _layout: UILayout;

  private readonly _tabs: Map<TTabId, Tab> = new Map();
  private _selectedTabId: TTabId | null = null;

  constructor(
    public readonly eventsChannel: EventEmitter,
    public readonly id: TTabContainerId,
    props?: ITabContainerProps,
  ) {
    this._divider = props?.divider ?? false;
    this._layout = new UILayout(`tab-container-${this.id}`, 'vertical');
  }

  get tabs(): Tab[] {
    return Array.from(this._tabs.values());
  }

  createTab(id: TTabId, props: ITabProps): Tab {
    const tab = new Tab(this.eventsChannel, id, props);

    this._layout.addChild(tab.layout);
    this._tabs.set(tab.id, tab);

    return tab;
  }

  get divider(): boolean {
    return this._divider;
  }

  get layout(): UILayout {
    return this._layout;
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

    this._layout.removeChild(tab.layout);
    this._tabs.delete(id);

    if (this._selectedTabId === id) {
      this._selectedTabId = null;
    }

    tab.close();

    return true;
  }

  setVisible(visible: boolean) {
    this._layout.setVisible(visible);
  }
}
