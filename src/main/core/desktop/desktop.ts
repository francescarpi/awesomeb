import { TDesktopId } from '@shared/types';

export class Desktop {
  private _name: string | null = null;

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
}
