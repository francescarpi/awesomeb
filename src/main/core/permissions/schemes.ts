import { z } from 'zod';

export const PermissionRecordScheme = z.record(z.string(), z.boolean());

export const PermissionsStoreScheme = z
  .object({
    permissions: z.record(z.string(), PermissionRecordScheme),
  })
  .strict();

export type IPermissionsStore = z.infer<typeof PermissionsStoreScheme>;
export type TPermissions = z.infer<typeof PermissionsStoreScheme>['permissions'];
