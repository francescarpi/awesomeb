import { Browser } from '@/core';
import { Menu } from 'electron';
import { EIcon, getIcon } from './utils';
import { IWinDesConTab } from '~/types';

export function tabMenu(browser: Browser, tabInfo: IWinDesConTab): Menu {
  const { tab, window } = tabInfo;
  const menu = Menu.buildFromTemplate([
    {
      label: 'Reload',
      enabled: !tab.loading && !tab.suspended,
      icon: getIcon(EIcon.Reload),
      click: () => {
        browser.performCommand(window, 'reload-tab', { tabId: tab.id });
      },
    },
    {
      label: 'Go back',
      enabled: !tab.loading && !tab.suspended && tab.view.canGoBack,
      icon: getIcon(EIcon.Back),
      click: () => {
        browser.performCommand(window, 'go-back', { tabId: tab.id });
      },
    },
    {
      label: 'Go forward',
      enabled: !tab.loading && !tab.suspended && tab.view.canGoForward,
      icon: getIcon(EIcon.Forward),
      click: () => {
        browser.performCommand(window, 'go-forward', { tabId: tab.id });
      },
    },
  ]);

  return menu;
}
