import type { THost, TPermission } from '~/types';

export interface IPermissionsStore {
  permissions: Record<THost, Record<TPermission, boolean>>;
}
