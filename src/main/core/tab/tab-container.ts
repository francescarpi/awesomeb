import { TTabContainerId, TTabId } from '~/types';
import { Tab } from './tab';
import EventEmitter from 'events';
import { ITabContainerProps, ITabProps } from './types';
import { UIVerticalLayout } from '@/ui';

export class TabContainer {
  private readonly _tabs: Map<TTabId, Tab> = new Map();
  private _divider: boolean;
  private _layout: UIVerticalLayout;

  constructor(
    public readonly eventsChannel: EventEmitter,
    public readonly id: TTabContainerId,
    props?: ITabContainerProps,
  ) {
    this._divider = props?.divider ?? false;
    this._layout = new UIVerticalLayout(`tab-container-${this.id}`);
  }

  get tabs(): Tab[] {
    return Array.from(this._tabs.values());
  }

  createTab(props: ITabProps): Tab {
    const tab = new Tab(this.eventsChannel, props);

    this._layout.add(tab.layout);
    this._tabs.set(tab.id, tab);
    return tab;
  }

  get divider(): boolean {
    return this._divider;
  }

  get layout(): UIVerticalLayout {
    return this._layout;
  }
}
