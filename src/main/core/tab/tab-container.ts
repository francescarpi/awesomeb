import { TTabId } from '~/types';
import { Tab } from './tab';
import EventEmitter from 'events';
import { ITabContainerProps, ITabProps } from './types';

export class TabContainer {
  private readonly _tabs: Map<TTabId, Tab> = new Map();
  private _divider: boolean;

  constructor(
    public readonly eventsChannel: EventEmitter,
    props?: ITabContainerProps,
  ) {
    this._divider = props?.divider ?? false;
  }

  get tabs(): Tab[] {
    return Array.from(this._tabs.values());
  }

  createTab(props: ITabProps): Tab {
    const tab = new Tab(this.eventsChannel, props);
    this._tabs.set(tab.id, tab);
    return tab;
  }

  get id(): number {
    // TODO remove, just for testing
    return 1;
  }

  get divider(): boolean {
    return this._divider;
  }
}
