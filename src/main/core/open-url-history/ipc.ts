import { createHandler, windowChecker, modalChecker } from '@/utils';
import { Browser, openURLHistory } from '@/core';

export function setupOpenURLHistoryIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ query: string }>(
    'open-url-history:find',
    'handle',
    browser,
    [windowChecker, modalChecker],
    async ({ query }) => {
      return openURLHistory.find(query);
    },
  );
}
