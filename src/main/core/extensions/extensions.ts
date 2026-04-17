import Store from 'electron-store';
import { IExtensionsStore } from './types';
import { userDataPath, extensionsPath } from '@/paths';
import { IExtension, TExtensionId } from '~/types';
import { loadLatestExtensionManifests } from './helpers';
import log from 'electron-log';
import { Browser } from '@/core';

const scopeLog = log.scope('Extensions');

export class Extensions {
  private readonly _store: Store<IExtensionsStore>;

  constructor(private readonly _browser: Browser) {
    this._store = new Store<IExtensionsStore>({
      name: 'extensions',
      cwd: userDataPath(),
      defaults: {
        extensions: {},
      },
    });
  }

  refresh() {
    const path = extensionsPath();
    const data = loadLatestExtensionManifests(path);
    const existing = this._store.get('extensions');

    for (const extension of data) {
      existing[extension.id] = {
        ...extension,
        enabled: existing[extension.id]?.enabled ?? false,
      };
    }

    // Cleanup removed extensions
    for (const extId of Object.keys(existing)) {
      if (!data.find((ext) => ext.id === extId)) {
        delete existing[extId];
      }
    }

    this._store.set('extensions', existing);
  }

  get all(): IExtension[] {
    const extensions = this._store.get('extensions');
    return Object.values(extensions);
  }

  get active(): IExtension[] {
    return this.all.filter((ext) => ext.enabled);
  }

  toggle(id: TExtensionId): IExtension | null {
    const extension = this._store.get(`extensions.${id}`);
    if (!extension) {
      scopeLog.warn(`Extension with id ${id} not found`);
      return null;
    }

    const enabled = !extension.enabled;
    this._store.set(`extensions.${id}.enabled`, enabled);
    // this._browser.channel.emit(EEventName.ExtensionEnabledDidChange);

    return this._store.get(`extensions.${id}`);
  }

  // getOrCreateExtensionInstance(
  //   partitionId: TPartitionId,
  //   extensionId: TExtensionId,
  // ): Extension | null {
  //   let partitionMap = this._extensionsByPartition.get(extensionId);
  //   if (!partitionMap) {
  //     partitionMap = new Map();
  //     this._extensionsByPartition.set(extensionId, partitionMap);
  //   }
  //
  //   let extensionInstance = partitionMap.get(partitionId);
  //   if (!extensionInstance) {
  //     const extensionData = this._store.get(`extensions.${extensionId}`);
  //     if (!extensionData) {
  //       scopeLog.warn(`Extension with id ${extensionId} not found`);
  //       return null;
  //     }
  //
  //     extensionInstance = new Extension(this._browser, partitionId, extensionData);
  //     partitionMap.set(partitionId, extensionInstance);
  //   }
  //
  //   return extensionInstance;
  // }

  // getExtensionByPartition(partitionId: TPartitionId, extensionId: TExtensionId): Extension | null {
  //   const partitionMap = this._extensionsByPartition.get(extensionId);
  //   if (!partitionMap) {
  //     return null;
  //   }
  //
  //   const extensionInstance = partitionMap.get(partitionId) || null;
  //   return extensionInstance;
  // }
}
