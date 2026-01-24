import { TDesktopId } from '~/types';
import { defaultTheme, Theme } from '@/core';
import { IProps } from './types';

export class Desktop {
  private _name: string | null = null;
  private _requireAttention: boolean = false;
  private _theme: Theme;

  constructor(
    public readonly id: TDesktopId,
    props?: IProps,
  ) {
    this._theme = props?.theme || defaultTheme;
  }

  setName(name: string) {
    if (name === this._name) {
      return;
    }

    this._name = name;

    // TODO emit event to channel
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
