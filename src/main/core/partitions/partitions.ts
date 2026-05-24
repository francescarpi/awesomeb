import { Partition } from './partition';
import { config } from '@/core';
import { TAB_PRELOAD, BROWSER_PRELOAD } from '@/paths';
import { TPartitionId } from '~/types';

export class Partitions {
  private _internal: Partition | null = null;
  private _default: Partition | null = null;
  private _private: Partition | null = null;
  private _customPartitions: Map<TPartitionId, Partition> = new Map();

  get internal(): Partition {
    if (!this._internal) {
      throw new Error('Partitions not initialized');
    }
    return this._internal;
  }

  get default(): Partition {
    if (!this._default) {
      throw new Error('Partitions not initialized');
    }
    return this._default;
  }

  get private(): Partition {
    if (!this._private) {
      throw new Error('Partitions not initialized');
    }
    return this._private;
  }

  init() {
    this._default = new Partition('Default', '#ffffff', false);
    this._default.registerPreloadScript(TAB_PRELOAD);

    this._private = new Partition('Private', '#000000', true);
    this._private.registerPreloadScript(TAB_PRELOAD);

    this._internal = new Partition('Internal', '#00000000', true);
    this._internal.registerPreloadScript(BROWSER_PRELOAD);

    for (const partitionConfig of config.getProperty('partitions')) {
      const partition = new Partition(partitionConfig.name, partitionConfig.color, false);
      partition.registerPreloadScript(TAB_PRELOAD);
      this._customPartitions.set(partition.id, partition);
    }
  }

  get(id: TPartitionId): Partition | null {
    if (id === 'default') {
      return this.default;
    } else if (id === 'private') {
      return this.private;
    }
    return this._customPartitions.get(id) || null;
  }

  get all(): Partition[] {
    return [this.default, this.private, ...this.customPartitions];
  }

  get customPartitions(): Partition[] {
    return Array.from(this._customPartitions.values());
  }

  get allForExtensions(): Partition[] {
    // Extensions should only have access to the default partition and any custom partitions
    return [this.default, ...this.customPartitions];
  }
}
