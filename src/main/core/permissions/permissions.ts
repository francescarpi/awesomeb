import Store from 'electron-store';
import { userDataPath } from '@/paths';
import type { IPermissionsStore } from './types';
import type { THost, TPermission } from '~/types';

import log from 'electron-log';
const scopeLog = log.scope('Permissions');

export class Permissions {
  private readonly _store: Store<IPermissionsStore>;

  constructor() {
    this._store = new Store<IPermissionsStore>({
      name: 'permissions',
      cwd: userDataPath(),
      defaults: {
        permissions: {},
      },
    });
  }

  get(host: THost, permission: TPermission): boolean | null {
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
    this._store.set('permissions', permissions);
  }

  get all(): IPermissionsStore['permissions'] {
    return this._store.get('permissions') || {};
  }

  deleteHost(host: THost) {
    scopeLog.info(`Deleting all permissions for host: ${host}`);

    const permissions = this._store.get('permissions') || {};
    if (permissions[host]) {
      delete permissions[host];
      this._store.set('permissions', permissions);
    }
  }

  saveAll(permissions: IPermissionsStore['permissions']): void {
    scopeLog.info('Saving all permissions');

    this._store.set('permissions', permissions);
  }
}
