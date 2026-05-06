import { Browser, Window } from '@/core';
import { createHandler, windowChecker } from '@/utils';

export function setupWindowIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'window:ready-to-show',
    'on',
    browser,
    [windowChecker],
    async ({ win }) => {
      win.show();
      win.focus();
    },
  );
}
