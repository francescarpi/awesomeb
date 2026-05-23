import { Browser, Window } from '@/core';
import { createHandler, windowChecker, viewChecker } from '@/utils';
import { TMenuType, TDesktopId, TTabId } from '~/types';
import log from 'electron-log';
import { desktopMenu } from './desktop';
import { mainMenu } from './main';
import { tabMenu } from './tab';
import { splitMenu } from './split';

const scopeLog = log.scope('MenuIPC');

export function setupMenuIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; type: TMenuType; params?: Record<string, unknown> }>(
    'menu:context-menu',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar', 'urlbar'])],
    async ({ win, type, params }) => {
      switch (type) {
        case 'desktop': {
          if (!params || !params['desktopId']) {
            scopeLog.warn(`Missing desktopId in params for desktop menu on window ${win.id}`);
            return;
          }
          const desktop = win.selectDesktop(params['desktopId'] as TDesktopId);
          if (!desktop) {
            scopeLog.warn(`Desktop with ID ${params['desktopId']} not found for window ${win.id}`);
            return;
          }

          const menu = desktopMenu(browser, win, desktop);
          menu.popup({ window: win.bw });
          break;
        }
        case 'main': {
          const menu = await mainMenu(browser, true);
          menu.popup({ window: win.bw });
          break;
        }
        case 'tab': {
          const tab = browser.getTab(params?.tabId as TTabId);
          if (!tab) {
            scopeLog.warn(`Tab with ID ${params?.tabId} not found for window ${win.id}`);
            return;
          }
          const menu = tabMenu(browser, tab);
          menu.popup({ window: win.bw });
          break;
        }
        case 'split': {
          const tabContainer = browser.selectedTab?.tabContainer;
          if (!tabContainer) {
            scopeLog.warn(
              `No selected tab or tab container found for window ${win.id} when opening split menu`,
            );
            return;
          }
          const menu = splitMenu(browser, win, tabContainer);
          menu.popup({ window: win.bw });
          break;
        }
      }
    },
  );
}
