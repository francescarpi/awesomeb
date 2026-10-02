import Store from 'electron-store';
import { userDataPath } from '@/paths';
import { PermissionsStoreScheme, type IPermissionsStore } from './schemes';
import type { THost, TPermission } from '~/types';
import { validateStore } from '@/core/validation';

import log from 'electron-log';
const scopeLog = log.scope('Permissions');

export class Permissions {
  private readonly _store: Store<IPermissionsStore>;
  private _cache: Map<THost, Record<string, boolean>> = new Map();
  private _allCache: IPermissionsStore['permissions'] | null = null;

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

    // Validate what electron-store loaded from disk, fall back to defaults if corrupted
    this._store.store = validateStore(
      PermissionsStoreScheme,
      this._store.store,
      'Permissions',
      defaults,
    );

    this._buildCache();
  }

  private _buildCache(): void {
    const permissions = this._store.get('permissions') || {};
    this._cache = new Map<THost, Record<string, boolean>>();
    for (const host of Object.keys(permissions)) {
      const perms = permissions[host] || {};
      this._cache.set(host, { ...perms });
    }
    // Shallow copy of the whole object tree for all()
    this._allCache = JSON.parse(JSON.stringify(permissions)) as IPermissionsStore['permissions'];
  }

  private _invalidateCache(): void {
    this._cache.clear();
    this._allCache = null;
  }

  peek(host: THost, permission: TPermission): boolean | null {
    const hostPerms = this._cache.get(host);
    if (hostPerms && Object.prototype.hasOwnProperty.call(hostPerms, permission)) {
      return hostPerms[permission];
    }
    return null;
  }

  get(host: THost, permission: TPermission): boolean | null {
    // Validate the full store on read (defensive)
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
    this._invalidateCache();
  }

  get all(): IPermissionsStore['permissions'] {
    // Validate the full store on read (defensive)
    PermissionsStoreScheme.parse(this._store.store);
    if (this._allCache) {
      return this._allCache;
    }
    const allPerms = this._store.get('permissions') || {};
    this._allCache = JSON.parse(JSON.stringify(allPerms)) as IPermissionsStore['permissions'];
    return this._allCache;
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
    this._invalidateCache();
  }

  saveAll(permissions: IPermissionsStore['permissions']): void {
    scopeLog.info('Saving all permissions');

    // Validate before persisting
    PermissionsStoreScheme.parse({ permissions });
    this._store.set('permissions', permissions);
    this._invalidateCache();
  }
}
