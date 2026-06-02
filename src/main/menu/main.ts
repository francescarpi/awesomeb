import { Browser, Tab, Window, bookmarks, getCachedFavicon, getShortcut } from '@/core';
import { MenuItemConstructorOptions, Menu, NativeImage, app } from 'electron';
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
    ...(process.platform === 'darwin' ? [appMenu(browser, showRootIcon, window)] : []),
    fileMenu(browser, showRootIcon, window),
    editMenu(browser, showRootIcon, window, tab),
    windowMenu(browser, showRootIcon, window),
    desktopsMenu(browser, showRootIcon, window),
    tabsMenu(browser, showRootIcon, window, tab),
    await bookmarksMenu(browser, showRootIcon, window),
  ]);

  return menu;
}

function appMenu(
  browser: Browser,
  showRootIcon: boolean,
  window: Window | null,
): MenuItemConstructorOptions {
  const preferences = getShortcut('preferences');
  return {
    role: 'appMenu',
    icon: showRootIcon ? getIcon(EIcon.Logo) : undefined,
    submenu: [
      {
        label: `About ${app.getName()}`,
        icon: getIcon(EIcon.Info),
        click: () => {
          if (window) {
            window.modal.open('about');
          }
        },
      },
      { type: 'separator' },
      {
        label: preferences.label,
        accelerator: preferences.key,
        icon: getIcon(EIcon.Command),
        enabled: !!window,
        click: () => {
          if (window) {
            browser.openURL(`${INTERNAL_PROTOCOL}://settings/`, { selectTab: true });
          }
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
  window: Window | null,
): MenuItemConstructorOptions {
  const performCommand = getShortcut('performCommand');
  const newTab = getShortcut('newTab');
  const newWindow = getShortcut('newWindow');
  const pasteAndGo = getShortcut('pasteAndGo');
  // const openRecentlyClosed = getShortcut('openRecentlyClosed');

  return {
    label: 'File',
    icon: showRootIcon ? getIcon(EIcon.File) : undefined,
    submenu: [
      {
        label: performCommand.label,
        accelerator: performCommand.key,
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
        label: newWindow.label,
        accelerator: newWindow.key,
        icon: getIcon(EIcon.Windows),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'new-window', { target: 'new-window' });
          }
        },
      },
      {
        label: newTab.label,
        accelerator: newTab.key,
        icon: getIcon(EIcon.Tab),
        click: () => {
          if (window) {
            window.modal.open('new-tab');
          }
        },
      },
      {
        label: pasteAndGo.label,
        enabled: !!window,
        icon: getIcon(EIcon.Open),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'tab-new-from-clipboard');
          }
        },
      },
      // {
      //   label: openRecentlyClosed.label,
      //   accelerator: openRecentlyClosed.key,
      //   enabled: closedTabs.tabs.length > 0,
      //   icon: getIcon(EIcon.Open),
      //   click: async () => {
      //     const tab = closedTabs.mostRecentTab;
      //     if (window && tab) {
      //       await browser.performCommand(window, 'open-closed', { id: tab.id });
      //     }
      //   },
      // },
    ],
  };
}

function editMenu(
  browser: Browser,
  showRootIcon: boolean,
  window: Window | null,
  tab: Tab | null,
): MenuItemConstructorOptions {
  const copyUrl = getShortcut('copyUrl');
  const editUrl = getShortcut('editUrl');
  const findInPage = getShortcut('findInPage');

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
        label: copyUrl.label,
        accelerator: copyUrl.key,
        icon: getIcon(EIcon.Copy),
        enabled: Boolean(tab),
        click: async () => {
          if (window && tab) {
            await browser.performCommand(window, 'copy-url');
          }
        },
      },
      {
        label: editUrl.label,
        accelerator: editUrl.key,
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
        label: findInPage.label,
        accelerator: findInPage.key,
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
  const toggleSidebar = getShortcut('toggleSidebar');
  const toggleMaximizeArea = getShortcut('toggleMaximizeArea');

  return {
    label: 'Window',
    icon: showRootIcon ? getIcon(EIcon.Windows) : undefined,
    submenu: [
      {
        label: toggleSidebar.label,
        accelerator: toggleSidebar.key,
        enabled: !!window,
        icon: getIcon(EIcon.Sidebar),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'toggle-sidebar');
          }
        },
      },
      {
        label: toggleMaximizeArea.label,
        accelerator: toggleMaximizeArea.key,
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
  const findDesktop = getShortcut('findDesktop');
  const previousDesktop = getShortcut('previousDesktop');
  const nextDesktop = getShortcut('nextDesktop');

  const totalDesktops = window?.desktops.length || 0;
  const desktopItems: MenuItemConstructorOptions[] = [];

  const desktopShortcuts = [
    'selectDesktop1',
    'selectDesktop2',
    'selectDesktop3',
    'selectDesktop4',
    'selectDesktop5',
    'selectDesktop6',
    'selectDesktop7',
    'selectDesktop8',
    'selectDesktop9',
  ];

  for (let i = 1; i <= 9; i++) {
    const shortcut = getShortcut(desktopShortcuts[i - 1]);
    desktopItems.push({
      label: `Desktop ${i}`,
      accelerator: shortcut.key,
      enabled: i <= totalDesktops,
      click: async () => {
        if (window) {
          await browser.performCommand(window, 'select-desktop', { desktopId: i });
        }
      },
    });
  }

  return {
    label: 'Desktops',
    icon: showRootIcon ? getIcon(EIcon.Desktop) : undefined,
    submenu: [
      {
        label: findDesktop.label,
        accelerator: findDesktop.key,
        enabled: !!window,
        icon: getIcon(EIcon.Desktop),
        click: () => {
          if (window) {
            window.modal.open('select-desktop');
          }
        },
      },
      { type: 'separator' },
      ...desktopItems,
      { type: 'separator' },
      {
        label: 'Previous',
        accelerator: previousDesktop.key,
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
        accelerator: nextDesktop.key,
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
  const findTab = getShortcut('findTab');
  const previousTab = getShortcut('previousTab');
  const nextTab = getShortcut('nextTab');
  const selectTabAttention = getShortcut('selectTabAttention');
  const tabSwitcher = getShortcut('tabSwitcher');
  const tabMarks = getShortcut('tabMarks');
  const moveTabUp = getShortcut('moveTabUp');
  const moveTabDown = getShortcut('moveTabDown');
  const suspendTab = getShortcut('suspendTab');
  const closeTab = getShortcut('closeTab');
  const reloadTab = getShortcut('reloadTab');
  const goBack = getShortcut('goBack');
  const goForward = getShortcut('goForward');
  const zoomIn = getShortcut('zoomIn');
  const zoomOut = getShortcut('zoomOut');
  const zoomReset = getShortcut('zoomReset');

  const tabs: MenuItemConstructorOptions[] = [];
  const totalContainers = window?.selectedDesktop?.tabContainers.length || 0;

  const tabShortcuts = [
    'selectTab1',
    'selectTab2',
    'selectTab3',
    'selectTab4',
    'selectTab5',
    'selectTab6',
    'selectTab7',
    'selectTab8',
    'selectTab9',
  ];

  for (let i = 1; i <= 9; i++) {
    const shortcut = getShortcut(tabShortcuts[i - 1]);
    tabs.push({
      label: `Tab ${i}`,
      enabled: i <= totalContainers,
      accelerator: shortcut.key,
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
        label: findTab.label,
        accelerator: findTab.key,
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
        accelerator: previousTab.key,
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
        accelerator: nextTab.key,
        enabled: !!window,
        icon: getIcon(EIcon.Next),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'next-tab');
          }
        },
      },
      {
        label: selectTabAttention.label,
        accelerator: selectTabAttention.key,
        icon: getIcon(EIcon.Notification),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'select-first-tab-require-attention');
          }
        },
      },
      {
        label: 'Tab switcher...',
        accelerator: tabSwitcher.key,
        icon: getIcon(EIcon.Tab),
        click: async () => {
          if (window && !window.isTabSwitcherVisible) {
            window.showTabSwitcher();
          }
        },
      },
      {
        label: tabMarks.label,
        accelerator: tabMarks.key,
        icon: getIcon(EIcon.Bookmarks),
        click: async () => {
          if (window && !window.isTabMarksVisible) {
            window.showTabMarks();
          }
        },
      },
      { type: 'separator' },
      {
        label: moveTabUp.label,
        accelerator: moveTabUp.key,
        icon: getIcon(EIcon.Up),
        click: async () => {
          if (window && tab) {
            await browser.performCommand(window, 'move-tab-container-up');
          }
        },
        enabled: !!tab,
      },
      {
        label: moveTabDown.label,
        accelerator: moveTabDown.key,
        icon: getIcon(EIcon.Down),
        click: async () => {
          if (window && tab) {
            await browser.performCommand(window, 'move-tab-container-down');
          }
        },
        enabled: !!tab,
      },
      { type: 'separator' },
      {
        label: suspendTab.label,
        accelerator: suspendTab.key,
        enabled: tab !== null && !tab?.suspended,
        icon: getIcon(EIcon.Suspend),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'suspend-tab');
          }
        },
      },
      {
        label: closeTab.label,
        accelerator: closeTab.key,
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
        label: reloadTab.label,
        accelerator: reloadTab.key,
        enabled: !!tab && !tab?.suspended,
        icon: getIcon(EIcon.Reload),
        click: async () => {
          if (window) {
            await browser.performCommand(window, 'reload-tab');
          }
        },
      },
      {
        label: goBack.label,
        enabled: !!tab && !tab.loading && !tab.suspended && tab.canGoBack,
        accelerator: goBack.key,
        icon: getIcon(EIcon.Back),
        click: () => {
          if (window && tab) {
            browser.performCommand(window, 'go-back', { tabId: tab.id });
          }
        },
      },
      {
        label: goForward.label,
        enabled: !!tab && !tab.loading && !tab.suspended && tab.canGoForward,
        accelerator: goForward.key,
        icon: getIcon(EIcon.Forward),
        click: () => {
          if (window && tab) {
            browser.performCommand(window, 'go-forward', { tabId: tab.id });
          }
        },
      },
      {
        label: 'Close tab preview',
        visible: false,
        accelerator: 'Escape',
        enabled: !!tab && !!tab.tabPreview,
        click: () => {
          if (window && tab && tab.tabPreview) {
            browser.performCommand(window, 'close-tab-preview');
          }
        },
      },
      {
        label: 'Accept tab preview',
        visible: false,
        accelerator: 'Enter',
        enabled: !!tab && !!tab.tabPreview,
        click: () => {
          if (window && tab && tab.tabPreview) {
            browser.performCommand(window, 'accept-tab-preview');
          }
        },
      },
      { type: 'separator' },
      {
        label: zoomIn.label,
        enabled: !!tab,
        accelerator: zoomIn.key,
        click: () => {
          if (tab && window) {
            browser.performCommand(window, 'zoom-in');
          }
        },
      },
      {
        label: zoomOut.label,
        enabled: !!tab,
        accelerator: zoomOut.key,
        click: () => {
          if (tab && window) {
            browser.performCommand(window, 'zoom-out');
          }
        },
      },
      {
        label: zoomReset.label,
        enabled: !!tab,
        accelerator: zoomReset.key,
        click: () => {
          if (tab && window) {
            browser.performCommand(window, 'zoom-reset');
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
  const openBookmark = getShortcut('openBookmark');

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
        label: openBookmark.label,
        accelerator: openBookmark.key,
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
        const icon = await getCachedFavicon(bookmark.url, { format: 'native12' });
        return {
          label: bookmark.title,
          icon: icon ? (icon as NativeImage) : undefined,
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
