import { OpenURLHistory } from './open-url-history';

export { setupOpenURLHistoryIpc } from './ipc';
export { type TFindUrlResult } from './types';

export const openURLHistory = new OpenURLHistory();
