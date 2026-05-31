import { Browser, WelcomeWindow } from '@/core';
import { createHandler, welcomeWindowChecker } from '@/utils';

export function setupWelcomeIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: WelcomeWindow }>(
    'welcome:ready',
    'on',
    browser,
    [welcomeWindowChecker],
    async ({ win }) => {
      win.show();
    },
  );
}
