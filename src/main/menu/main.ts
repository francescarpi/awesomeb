import { Browser, Window } from '@/core';
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
    editMenu(browser, showRootIcon, focusedWindow),
    windowMenu(browser, showRootIcon, focusedWindow),
    desktopsMenu(browser, showRootIcon, focusedWindow),
  ]);

  return menu;
}

function appMenu(_browser: Browser, _showRootIcon: boolean): MenuItemConstructorOptions {
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
  _browser: Browser,
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

function editMenu(
  _browser: Browser,
  showRootIcon: boolean,
  _focusedWindow: Window | null,
): MenuItemConstructorOptions {
  return {
    label: 'Edit',
    icon: showRootIcon ? getIcon(EIcon.Edit) : undefined,
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteAndMatchStyle' },
      { role: 'delete' },
      { role: 'selectAll' },
      { type: 'separator' },
      // {
      //   label: 'Copy URL',
      //   accelerator: 'CmdOrCtrl+Shift+C',
      //   icon: getIcon(EIcon.Copy),
      //   enabled: Boolean(selectedTab),
      //   click: () => browser.performCommand({ trigger: 'copy-url', params: { windowId: focusedWindow.id } }),
      // },
      // {
      //   label: 'Edit URL',
      //   accelerator: 'CmdOrCtrl+E',
      //   icon: getIcon(EIcon.Edit),
      //   enabled: Boolean(selectedTab),
      //   click: () => browser.showPerformCommandDialog(focusedWindow.id, { trigger: 'edit-url' }),
      // },
      // { type: 'separator' },
      // {
      //   label: 'Find in page...',
      //   accelerator: 'CmdOrCtrl+F',
      //   icon: getIcon(EIcon.Search),
      //   enabled: Boolean(selectedTab) && selectedTab?.hasTabPreview === false,
      //   click: () =>
      //     browser.performCommand({
      //       trigger: 'find-in-page',
      //       params: { windowId: focusedWindow.id, tabId: selectedTab!.id },
      //     }),
      // },
    ],
  };
}

function windowMenu(
  browser: Browser,
  showRootIcon: boolean,
  focusedWindow: Window | null,
): MenuItemConstructorOptions {
  return {
    label: 'Window',
    icon: showRootIcon ? getIcon(EIcon.Windows) : undefined,
    submenu: [
      {
        label: 'Toggle sidebar',
        accelerator: 'CmdOrCtrl+S',
        enabled: !!focusedWindow,
        icon: getIcon(EIcon.Sidebar),
        click: () => {
          if (focusedWindow) {
            browser.performCommand(focusedWindow, 'toggle-sidebar');
          }
        },
      },
      {
        label: 'Toggle maximize area',
        accelerator: 'CmdOrCtrl+I',
        enabled: !!focusedWindow,
        icon: getIcon(EIcon.Maximize),
        click: () => {
          if (focusedWindow) {
            browser.performCommand(focusedWindow, 'toggle-maximize-area');
          }
        },
      },
    ],
  };
}

function desktopsMenu(
  browser: Browser,
  showRootIcon: boolean,
  focusedWindow: Window | null,
): MenuItemConstructorOptions {
  const desktops = focusedWindow?.desktops || [];
  const selectedDesktop = focusedWindow?.selectedDesktop;

  return {
    label: 'Desktops',
    icon: showRootIcon ? getIcon(EIcon.Desktop) : undefined,
    submenu: [
      {
        label: 'Select...',
        accelerator: 'CmdOrCtrl+D',
        enabled: !!focusedWindow,
        icon: getIcon(EIcon.Desktop),
        click: () => {
          if (focusedWindow) {
            focusedWindow.modal.open('select-desktop', { height: 450 });
          }
        },
      },
      { type: 'separator' },
      ...desktops.map((desktop) => ({
        label: `Desktop ${desktop.id}`,
        accelerator: `Shift+CmdOrCtrl+${desktop.id}`,
        enabled: !selectedDesktop || selectedDesktop.id !== desktop.id,
        click: () => {
          if (focusedWindow) {
            browser.performCommand(focusedWindow, 'select-desktop', { desktopId: desktop.id });
          }
        },
      })),
      { type: 'separator' },
      {
        label: 'Previous',
        accelerator: 'Shift+CmdOrCtrl+[',
        enabled: !!focusedWindow,
        icon: getIcon(EIcon.Previous),
        click: () => {
          if (focusedWindow) {
            browser.performCommand(focusedWindow, 'previous-desktop');
          }
        },
      },
      {
        label: 'Next',
        accelerator: 'Shift+CmdOrCtrl+]',
        enabled: !!focusedWindow,
        icon: getIcon(EIcon.Next),
        click: () => {
          if (focusedWindow) {
            browser.performCommand(focusedWindow, 'next-desktop');
          }
        },
      },
    ],
  };
}
