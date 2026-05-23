export type THost = string;
export type TPermission = string;

export enum EPermissionConfigType {
  Standard = 'standard',
  Strict = 'strict',
}

export type { TPermissions } from '@/core/permissions/schemes';
