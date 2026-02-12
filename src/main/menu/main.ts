import { Browser, Tab, Window, bookmarks } from '@/core';
import { MenuItemConstructorOptions, Menu } from 'electron';
import log from 'electron-log';
import { EIcon, getIcon } from './utils';
import { EBookmarkType, IBookmark } from '~/types';
import { INTERNAL_PROTOCOL } from '~/constants';

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
    editMenu(browser, showRootIcon, window, tab),
    windowMenu(browser, showRootIcon, window),
    desktopsMenu(browser, showRootIcon, window),
    tabsMenu(browser, showRootIcon, window, tab),
    await bookmarksMenu(browser, showRootIcon, window),
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
            window.modal.open('perform-command');
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
            window.modal.open('new-tab');
          }
        },
      },
    ],
  };
}

function editMenu(
  browser: Browser,
  showRootIcon: boolean,
  window: Window | null,
  tab: Tab | null,
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
      {
        label: 'Copy URL',
        accelerator: 'CmdOrCtrl+Shift+C',
        icon: getIcon(EIcon.Copy),
        enabled: Boolean(tab),
        click: async () => {
          if (window && tab) {
            await browser.performCommand(window, 'copy-url');
          }
        },
      },
      {
        label: 'Edit URL',
        accelerator: 'CmdOrCtrl+E',
        icon: getIcon(EIcon.Edit),
        enabled: Boolean(tab),
        click: () => {
          if (window && tab) {
            window.modal.open('edit-url');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Find in page...',
        accelerator: 'CmdOrCtrl+F',
        icon: getIcon(EIcon.Search),
        enabled: Boolean(tab),
        click: async () => {
          if (window && tab) {
            await browser.performCommand(window, 'find-in-page');
          }
        },
      },
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
        label: 'Find...',
        accelerator: 'CmdOrCtrl+D',
        enabled: !!window,
        icon: getIcon(EIcon.Desktop),
        click: () => {
          if (window) {
            window.modal.open('select-desktop');
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
  const tabs: MenuItemConstructorOptions[] = [];
  const totalContainers = window?.selectedDesktop?.tabContainers.length || 0;
  const requireAttention = window ? window.tabsRequireAttention.length > 0 : false;

  for (let i = 1; i <= 9; i++) {
    tabs.push({
      label: `Tab ${i}`,
      enabled: i <= totalContainers,
      accelerator: `CmdOrCtrl+${i}`,
      click: () => {
        if (window) {
          browser.performCommand(window, 'select-tabcontainer-by-index', { index: i });
        }
      },
    });
  }

  return {
    label: 'Tabs',
    icon: showRootIcon ? getIcon(EIcon.Tab) : undefined,
    submenu: [
      {
        label: 'Find...',
        accelerator: 'CmdOrCtrl+.',
        enabled: !!window,
        icon: getIcon(EIcon.Tab),
        click: () => {
          if (window) {
            window.modal.open('select-tab');
          }
        },
      },
      { type: 'separator' },
      ...tabs,
      { type: 'separator' },
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
      {
        label: 'Select require attention',
        accelerator: 'CmdOrCtrl+U',
        icon: getIcon(EIcon.Notification),
        enabled: requireAttention,
        click: async () => {
          if (window && requireAttention) {
            await browser.performCommand(window, 'select-first-tab-require-attention');
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
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        enabled: tab !== null,
        icon: getIcon(EIcon.Close),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'close-tab');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        enabled: !!tab && !tab?.suspended,
        icon: getIcon(EIcon.Reload),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'reload-tab');
          }
        },
      },
      {
        label: 'Go back',
        enabled: !!tab && !tab.loading && !tab.suspended && tab.view.canGoBack,
        accelerator: 'CmdOrCtrl+Left',
        icon: getIcon(EIcon.Back),
        click: () => {
          if (window && tab) {
            browser.performCommand(window, 'go-back', { tabId: tab.id });
          }
        },
      },
      {
        label: 'Go forward',
        enabled: !!tab && !tab.loading && !tab.suspended && tab.view.canGoForward,
        accelerator: 'CmdOrCtrl+Right',
        icon: getIcon(EIcon.Forward),
        click: () => {
          if (window && tab) {
            browser.performCommand(window, 'go-forward', { tabId: tab.id });
          }
        },
      },
    ],
  };
}

async function bookmarksMenu(
  browser: Browser,
  showRootIcon: boolean,
  window: Window | null,
): Promise<MenuItemConstructorOptions> {
  return {
    label: 'Bookmarks',
    icon: showRootIcon ? getIcon(EIcon.Bookmarks) : undefined,
    submenu: [
      {
        label: 'Manage bookmarks',
        icon: getIcon(EIcon.Bookmarks),
        enabled: !!window,
        click: () => {
          browser.openURL(`${INTERNAL_PROTOCOL}://bookmarks`, {
            selectTab: true,
          });
        },
      },
      {
        label: 'Open bookmark',
        accelerator: 'CmdOrCtrl+B',
        icon: getIcon(EIcon.Open),
        click: () => {
          if (window) {
            window.modal.open('open-bookmark');
          }
        },
      },
      { type: 'separator' },
      ...(await bookmarkSubMenu(browser, window, bookmarks.all)),
    ],
  };
}

async function bookmarkSubMenu(
  browser: Browser,
  window: Window | null,
  bookmarks: IBookmark[],
): Promise<MenuItemConstructorOptions[]> {
  return await Promise.all(
    bookmarks.map(async (bookmark) => {
      if (bookmark.type === EBookmarkType.Url) {
        // const icon = await getCachedFavicon(bookmark.url, { format: 'native16' });
        return {
          label: bookmark.title,
          // icon: icon ? (icon as NativeImage) : undefined,
          click: () => {
            browser.openURL(bookmark.url, { selectTab: true });
          },
        };
      }

      return {
        label: bookmark.title,
        submenu: await bookmarkSubMenu(browser, window, bookmark.children),
        icon: getIcon(EIcon.Folder),
      };
    }),
  );
}
