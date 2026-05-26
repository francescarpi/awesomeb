import { type TPartitionId } from '~/types';
import { session, type Session, app } from 'electron';

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
    this.ses.setSpellCheckerLanguages([
      'en-US',
      'en-GB',
      `${app.getLocale()}-${app.getLocaleCountryCode()}`,
    ]);
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

  registerPreloadScript(filePath: string, type: 'frame' | 'service-worker' = 'frame') {
    this.ses.registerPreloadScript({
      type,
      filePath,
    });
  }
}
