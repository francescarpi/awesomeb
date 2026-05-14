import { Permissions } from './permissions';
export { ALLOWED_PERMISSIONS } from './constants';
export { setupPermissionsIPC } from './ipc';

export const permissions = new Permissions();
