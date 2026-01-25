import { type TPartitionId } from '~/types';

export class Partition {
  constructor(
    private readonly _name: string,
    private readonly _color: string,
    private readonly _private: boolean = false,
  ) {}

  get id(): TPartitionId {
    const id = this._name.toLowerCase().replace(/\s+/g, '-');
    return this._private ? id : `persist:${id}`;
  }

  get name(): string {
    return this._name;
  }

  get private(): boolean {
    return this._private;
  }

  get color(): string {
    return this._color;
  }
}
