import { type TPartitionId } from '~/types';
import { session, type Session } from 'electron';

export class Partition {
  public readonly id: TPartitionId;
  public readonly ses: Session;

  constructor(
    private readonly _name: string,
    private readonly _color: string,
    private readonly _private: boolean = false,
  ) {
    const id = this._name.toLowerCase().replace(/\s+/g, '-');
    this.id = this._private ? id : `persist:${id}`;

    this.ses = session.fromPartition(this.id);
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
