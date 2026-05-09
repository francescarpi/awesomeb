import { Browser, Window } from '@/core';
import { createHandler, windowChecker, viewChecker } from '@/utils';
import { TDesktopId, ITheme } from '~/types';

export function setupDesktopIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; desktopId: TDesktopId }>(
    'desktops:select',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar'])],
    async ({ win, desktopId }) => {
      win.selectDesktop(desktopId);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'desktops:get-theme',
    'handle',
    browser,
    [windowChecker],
    async ({ win }) => {
      const theme = win.selectedDesktop.theme;
      const result: ITheme = {
        primary: theme.primary,
        secondary: theme.secondary,
        degrees: theme.degrees,
      };
      return result;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'desktops:get-visible',
    'handle',
    browser,
    [windowChecker],
    async ({ win }) => {
      return browser.renderer.visibleDesktops(win);
    },
  );
}
