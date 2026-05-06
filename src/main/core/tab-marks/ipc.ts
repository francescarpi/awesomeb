import log from 'electron-log';
import { Browser, tabMarks, Window } from '@/core';
import { TMarksAction } from '~/types';
import { createHandler, windowChecker, viewChecker } from '@/utils';

const scopeLog = log.scope('TabMarksIPC');

export function setupTabMarksIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'tabmarks:get',
    'handle',
    browser,
    [windowChecker, viewChecker.bind(null, ['tab-marks'])],
    async () => {
      return tabMarks.all;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'tabmarks:close',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['tab-marks'])],
    async ({ win }) => {
      win.hideTabMarks();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; action: TMarksAction }>(
    'tabmarks:perform',
    'handle',
    browser,
    [windowChecker, viewChecker.bind(null, ['tab-marks'])],
    async ({ win, action }) => {
      const selectedTabData = win.selectedTab;

      switch (action.id) {
        case 'deleteAll':
          tabMarks.deleteAll();
          break;
        case 'deleteOne': {
          if (!selectedTabData) {
            break;
          }

          tabMarks.deleteByTabId(selectedTabData.tab.id);
          break;
        }
        case 'add': {
          if (!selectedTabData) {
            break;
          }

          tabMarks.add(action.trigger, selectedTabData.tab.id, selectedTabData.tab.title);
          break;
        }
        case 'select': {
          const mark = tabMarks.get(action.trigger);
          if (!mark) {
            break;
          }

          const tabData = win.getTab(mark.tabId);
          if (!tabData) {
            scopeLog.warn(`Tab with ID ${mark.tabId} not found for mark ${mark.trigger}`);
            tabMarks.deleteByTabId(mark.tabId);
            break;
          }

          win.hideTabMarks();
          win.selectTab(mark.tabId);
        }
      }

      return tabMarks.all;
    },
  );
}
