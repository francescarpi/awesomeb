import { Browser, Window } from '@/core';
import { createHandler, windowChecker, tabChecker, viewChecker } from '@/utils';
import type { IWinDesConTab, IMediaSessionInfo, TMediaSessionAction } from '~/types';

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
  createHandler<{ tab: IWinDesConTab; info: IMediaSessionInfo | null }>(
    'window:media-session-changed',
    'on',
    browser,
    [tabChecker],
    async ({ tab, info }) => {
      tab.tab.setMediaSessionInfo(info);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; tab: IWinDesConTab; action: TMediaSessionAction }>(
    'window:media-session-action',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar']), tabChecker],
    async ({ tab, action }) => {
      browser.toRenderer.mediaSessionAction(tab.tab, action);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'window:get-media-session',
    'handle',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar'])],
    async ({ win }) => {
      return win.mediaSession;
    },
  );
}
