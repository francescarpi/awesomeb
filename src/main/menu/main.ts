import { Browser, Tab, Window } from '@/core';
import { MenuItemConstructorOptions, Menu } from 'electron';
import log from 'electron-log';
import { EIcon, getIcon } from './utils';

const scopeLog = log.scope('MainMenu');

export async function mainMenu(browser: Browser, showRootIcon: boolean) {
  scopeLog.info('Setting up main menu');

  const window = browser.activeWindow;
  const desktop = window?.selectedDesktop || null;
  const tabContainer = desktop?.selectedTabContainer || null;
  const tab = tabContainer?.selectedTab || null;

  const menu = Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [appMenu(browser, showRootIcon)] : []),
    fileMenu(browser, showRootIcon, window),
    editMenu(browser, showRootIcon, window),
    windowMenu(browser, showRootIcon, window),
    desktopsMenu(browser, showRootIcon, window),
    tabsMenu(browser, showRootIcon, window, tab),
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
        // enabled: !!window,
        click: () => {
          // if (window) {
          //   window.openInternalPage(PAGE_PREFERENCES);
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
  window: Window | null,
): MenuItemConstructorOptions {
  return {
    label: 'File',
    icon: showRootIcon ? getIcon(EIcon.File) : undefined,
    submenu: [
      {
        label: 'Perform command',
        accelerator: 'CmdOrCtrl+P',
        enabled: !!window,
        icon: getIcon(EIcon.Command),
        click: () => {
          if (window) {
            window.modal.open('perform-command', {
              width: 500,
              height: 500,
            });
          }
        },
      },
      { type: 'separator' },
      {
        label: 'New tab',
        accelerator: 'CmdOrCtrl+T',
        icon: getIcon(EIcon.Tab),
        click: () => {
          if (window) {
            window.modal.open('new-tab', { height: 450 });
          }
        },
      },
      // { type: 'separator' },
      // {
      //   label: 'Select desktop',
      //   accelerator: 'CmdOrCtrl+D',
      //   icon: getIcon(EIcon.Desktop),
      //   click: () =>
      //     window
      //       ? browser.showPerformCommandDialog(window.id, { trigger: 'select-desktop' })
      //       : null,
      // },
      // {
      //   label: 'Select tab',
      //   accelerator: 'CmdOrCtrl+.',
      //   icon: getIcon(EIcon.Tab),
      //   click: () =>
      //     window
      //       ? browser.showPerformCommandDialog(window.id, {
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
  _window: Window | null,
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
      //   click: () => browser.performCommand({ trigger: 'copy-url', params: { windowId: window.id } }),
      // },
      // {
      //   label: 'Edit URL',
      //   accelerator: 'CmdOrCtrl+E',
      //   icon: getIcon(EIcon.Edit),
      //   enabled: Boolean(selectedTab),
      //   click: () => browser.showPerformCommandDialog(window.id, { trigger: 'edit-url' }),
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
      //       params: { windowId: window.id, tabId: selectedTab!.id },
      //     }),
      // },
    ],
  };
}

function windowMenu(
  browser: Browser,
  showRootIcon: boolean,
  window: Window | null,
): MenuItemConstructorOptions {
  return {
    label: 'Window',
    icon: showRootIcon ? getIcon(EIcon.Windows) : undefined,
    submenu: [
      {
        label: 'Toggle sidebar',
        accelerator: 'CmdOrCtrl+S',
        enabled: !!window,
        icon: getIcon(EIcon.Sidebar),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'toggle-sidebar');
          }
        },
      },
      {
        label: 'Toggle maximize area',
        accelerator: 'CmdOrCtrl+I',
        enabled: !!window,
        icon: getIcon(EIcon.Maximize),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'toggle-maximize-area');
          }
        },
      },
    ],
  };
}

function desktopsMenu(
  browser: Browser,
  showRootIcon: boolean,
  window: Window | null,
): MenuItemConstructorOptions {
  const desktops = window?.desktops || [];
  const selectedDesktop = window?.selectedDesktop;

  return {
    label: 'Desktops',
    icon: showRootIcon ? getIcon(EIcon.Desktop) : undefined,
    submenu: [
      {
        label: 'Select...',
        accelerator: 'CmdOrCtrl+D',
        enabled: !!window,
        icon: getIcon(EIcon.Desktop),
        click: () => {
          if (window) {
            window.modal.open('select-desktop', { height: 450 });
          }
        },
      },
      { type: 'separator' },
      ...desktops.map((desktop) => ({
        label: `Desktop ${desktop.id}`,
        accelerator: `Shift+CmdOrCtrl+${desktop.id}`,
        enabled: !selectedDesktop || selectedDesktop.id !== desktop.id,
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'select-desktop', { desktopId: desktop.id });
          }
        },
      })),
      { type: 'separator' },
      {
        label: 'Previous',
        accelerator: 'Shift+CmdOrCtrl+[',
        enabled: !!window,
        icon: getIcon(EIcon.Previous),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'previous-desktop');
          }
        },
      },
      {
        label: 'Next',
        accelerator: 'Shift+CmdOrCtrl+]',
        enabled: !!window,
        icon: getIcon(EIcon.Next),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'next-desktop');
          }
        },
      },
    ],
  };
}

function tabsMenu(
  browser: Browser,
  showRootIcon: boolean,
  window: Window | null,
  tab: Tab | null,
): MenuItemConstructorOptions {
  return {
    label: 'Tabs',
    icon: showRootIcon ? getIcon(EIcon.Tab) : undefined,
    submenu: [
      {
        label: 'Previous',
        accelerator: 'CmdOrCtrl+]',
        enabled: !!window,
        icon: getIcon(EIcon.Previous),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'previous-tab');
          }
        },
      },
      {
        label: 'Next',
        accelerator: 'CmdOrCtrl+[',
        enabled: !!window,
        icon: getIcon(EIcon.Next),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'next-tab');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Suspend',
        accelerator: 'CmdOrCtrl+Shift+S',
        enabled: tab !== null && !tab?.suspended,
        icon: getIcon(EIcon.Suspend),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'suspend-tab');
          }
        },
      },
    ],
  };
}
