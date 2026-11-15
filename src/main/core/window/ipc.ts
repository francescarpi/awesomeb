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

  //--------------------------------------------------------------------------------------
  // The renderer is the only process that can evaluate the
  // `prefers-reduced-motion` media query, so it relays the result here.
  createHandler<{ win: Window; reduced: boolean }>(
    'window:set-reduced-motion',
    'on',
    browser,
    [windowChecker],
    async ({ win, reduced }) => {
      win.reducedMotion = !!reduced;
    },
  );
}
