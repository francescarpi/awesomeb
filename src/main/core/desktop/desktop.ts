import { TDesktopId } from '@shared/types';

export class Desktop {
  private _name: string | null = null;
  private _requireAttention: boolean = false;

  constructor(public readonly id: TDesktopId) {}

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
}
