import { Browser, Window } from '@/core';
import { IContextualModalParams, TPage } from '~/types';
import { createHandler, modalChecker, windowChecker, viewChecker } from '@/utils';

export function setupUIIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'modal:close',
    'on',
    browser,
    [windowChecker, modalChecker],
    async ({ win }) => {
      win.modal.close();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; width: number; height: number }>(
    'modal:resize',
    'on',
    browser,
    [windowChecker, modalChecker],
    async ({ win, width, height }) => {
      win.modal.resize(width, height);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; page: TPage }>(
    'modal:open',
    'on',
    browser,
    [windowChecker, modalChecker],
    async ({ win, page }) => {
      win.modal.open(page);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'tabswitcher:close',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['tab-switcher'])],
    async ({ win }) => {
      win.hideTabSwitcher();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; page: TPage; params: IContextualModalParams }>(
    'modal:open-contextual',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar'])],
    async ({ win, page, params }) => {
      win.openContextualModal(page, params);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'modal:close-contextual',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['contextual-modal'])],
    async ({ win }) => {
      win.closeContextualModal();
    },
  );
}
