import { TDesktopId } from '~/types';
import { defaultTheme, Theme, Window } from '@/core';
import { IProps } from './types';
import EventEmitter from 'events';

export class Desktop {
  private _name: string | null = null;
  private _requireAttention: boolean = false;
  private _theme: Theme;

  constructor(
    public readonly eventsChannel: EventEmitter,
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

    this.eventsChannel.emit('desktop:name-did-change', this.window, this);
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
    // TODO implement
    return false;
  }

  get hasActiveTabs(): boolean {
    // TODO implement
    return false;
  }

  get theme(): Theme {
    return this._theme;
  }
}
