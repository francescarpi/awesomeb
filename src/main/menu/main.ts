import { Browser, Window } from '@main/core';
import { MenuItemConstructorOptions, Menu } from 'electron';
import log from 'electron-log';
import { EIcon, getIcon } from './utils';

const scopeLog = log.scope('MainMenu');

export async function mainMenu(browser: Browser, showRootIcon: boolean) {
  scopeLog.info('Setting up main menu');

  const focusedWindow = browser.getFocusedWindow();

  const menu = Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [appMenu(browser, showRootIcon)] : []),
    fileMenu(browser, showRootIcon, focusedWindow),
  ]);

  return menu;
}

function appMenu(browser: Browser, showRootIcon: boolean): MenuItemConstructorOptions {
  return {
    role: 'appMenu',
    // icon: showRootIcon ? getIcon(EIcon.Logo) : undefined,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      {
        label: 'Preferences',
        accelerator: 'CmdOrCtrl+,',
        // icon: getIcon(EIcon.Command),
        // enabled: !!focusedWindow,
        click: () => {
          // if (focusedWindow) {
          //   focusedWindow.openInternalPage(PAGE_PREFERENCES);
          // }
        },
      },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  };
}

function fileMenu(
  browser: Browser,
  showRootIcon: boolean,
  focusedWindow: Window | null,
): MenuItemConstructorOptions {
  return {
    label: 'File',
    icon: showRootIcon ? getIcon(EIcon.File) : undefined,
    submenu: [
      {
        label: 'Perform command',
        accelerator: 'CmdOrCtrl+P',
        enabled: !!focusedWindow,
        icon: getIcon(EIcon.Command),
        click: () => {
          if (focusedWindow) {
            focusedWindow.performCommand();
          }
        },
      },
      // { type: 'separator' },
      // {
      //   label: 'New tab',
      //   accelerator: 'CmdOrCtrl+T',
      //   icon: getIcon(EIcon.Tab),
      //   click: () =>
      //     focusedWindow
      //       ? browser.showPerformCommandDialog(focusedWindow.id, { trigger: 'new-tab' })
      //       : null,
      // },
      // { type: 'separator' },
      // {
      //   label: 'Select desktop',
      //   accelerator: 'CmdOrCtrl+D',
      //   icon: getIcon(EIcon.Desktop),
      //   click: () =>
      //     focusedWindow
      //       ? browser.showPerformCommandDialog(focusedWindow.id, { trigger: 'select-desktop' })
      //       : null,
      // },
      // {
      //   label: 'Select tab',
      //   accelerator: 'CmdOrCtrl+.',
      //   icon: getIcon(EIcon.Tab),
      //   click: () =>
      //     focusedWindow
      //       ? browser.showPerformCommandDialog(focusedWindow.id, {
      //           trigger: 'select-tab-container',
      //         })
      //       : null,
      // },
    ],
  };
}
