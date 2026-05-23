import Store from 'electron-store';
import { userDataPath } from '@/paths';
import { PermissionsStoreScheme, type IPermissionsStore } from './schemes';
import type { THost, TPermission } from '~/types';

import log from 'electron-log';
const scopeLog = log.scope('Permissions');

export class Permissions {
  private readonly _store: Store<IPermissionsStore>;

  constructor() {
    const defaults: IPermissionsStore = {
      permissions: {},
    };

    // Validate defaults before passing to electron-store
    PermissionsStoreScheme.parse(defaults);

    this._store = new Store<IPermissionsStore>({
      name: 'permissions',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk
    PermissionsStoreScheme.parse(this._store.store);
  }

  get(host: THost, permission: TPermission): boolean | null {
    // Validate the full store on read
    PermissionsStoreScheme.parse(this._store.store);

    const permissions = this._store.get('permissions') || {};
    if (!permissions[host]) {
      return null;
    }

    const value = permissions[host][permission];
    return value !== undefined ? value : null;
  }

  set(host: THost, permission: TPermission, granted: boolean): void {
    scopeLog.info(`Setting permission: host=${host}, permission=${permission}, granted=${granted}`);

    const permissions = this._store.get('permissions') || {};
    if (!permissions[host]) {
      permissions[host] = {};
    }
    permissions[host][permission] = granted;

    // Validate before persisting
    PermissionsStoreScheme.parse({ permissions });
    this._store.set('permissions', permissions);
  }

  get all(): IPermissionsStore['permissions'] {
    // Validate the full store on read
    PermissionsStoreScheme.parse(this._store.store);
    return this._store.get('permissions') || {};
  }

  deleteHost(host: THost) {
    scopeLog.info(`Deleting all permissions for host: ${host}`);

    const permissions = this._store.get('permissions') || {};
    if (permissions[host]) {
      delete permissions[host];
    }

    // Validate before persisting
    PermissionsStoreScheme.parse({ permissions });
    this._store.set('permissions', permissions);
  }

  saveAll(permissions: IPermissionsStore['permissions']): void {
    scopeLog.info('Saving all permissions');

    // Validate before persisting
    PermissionsStoreScheme.parse({ permissions });
    this._store.set('permissions', permissions);
  }
}
