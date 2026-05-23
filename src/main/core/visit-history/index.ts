export { VisitHistory } from './visit-history';
export { setupVisitHistoryIPC } from './ipc';
export { registerVisitHistoryHooks } from './browser-hooks';
export * from './types';

import { VisitHistory } from './visit-history';

export const visitHistory = new VisitHistory();
