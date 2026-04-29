import { Browser, bookmarks, Window, partitions } from '@/core';
import { Menu, MenuItemConstructorOptions } from 'electron';
import { EIcon, getIcon } from './utils';
import { EBookmarkType, IBookmark, IWinDesConTab } from '~/types';
import { createColorImage } from '@/utils';

export function tabMenu(browser: Browser, tabInfo: IWinDesConTab): Menu {
  const { tab, window, tabContainer, desktop } = tabInfo;

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
      enabled: !tab.loading && !tab.suspended && tab.canGoBack,
      icon: getIcon(EIcon.Back),
      click: () => {
        browser.performCommand(window, 'go-back', { tabId: tab.id });
      },
    },
    {
      label: 'Go forward',
      enabled: !tab.loading && !tab.suspended && tab.canGoForward,
      icon: getIcon(EIcon.Forward),
      click: () => {
        browser.performCommand(window, 'go-forward', { tabId: tab.id });
      },
    },
    { type: 'separator' },
    {
      label: 'Rename',
      icon: getIcon(EIcon.Edit),
      click: () => {
        window.modal.open('rename-tab', {
          query: { tabId: tab.id.toString() },
        });
      },
    },
    { type: 'separator' },
    {
      label: 'Move...',
      icon: getIcon(EIcon.Move),
      submenu: browser.renderer.targetsEntities(browser, window).map((target) => ({
        label: target.label,
        click: async () => {
          await browser.performCommand(window, 'move-tab', { tabId: tab.id, targetId: target.id });
        },
      })),
    },
    {
      label: 'Duplicate...',
      icon: getIcon(EIcon.Copy),
      submenu: browser.renderer.targetsEntities(browser, window).map((target) => ({
        label: target.label,
        click: async () => {
          await browser.performCommand(window, 'duplicate-tab', {
            tabId: tab.id,
            targetId: target.id,
          });
        },
      })),
    },
    {
      label: 'Change profile...',
      icon: getIcon(EIcon.Partition),
      submenu: partitions.all.map((partition) => ({
        label: partition.name,
        icon: createColorImage(partition.color),
        click: async () => {
          await browser.performCommand(window, 'change-tab-profile', {
            tabId: tab.id,
            partitionId: partition.id,
          });
        },
      })),
    },
    { type: 'separator' },
    {
      label: 'Suspend',
      icon: getIcon(EIcon.Suspend),
      enabled: !tab.suspended,
      click: async () => {
        await browser.performCommand(window, 'suspend-tab', { tabId: tab.id });
      },
    },
    {
      label: 'Close',
      icon: getIcon(EIcon.Close),
      click: async () => {
        await browser.performCommand(window, 'close-tab', { tabId: tab.id });
      },
    },
    {
      label: 'Close below',
      icon: getIcon(EIcon.Close),
      click: async () => {
        await browser.performCommand(window, 'close-tabs-below', { tabId: tab.id });
      },
    },
    { type: 'separator' },
    {
      label: tab.isMuted ? 'Unmute' : 'Mute',
      icon: getIcon(tab.isMuted ? EIcon.Unmute : EIcon.Mute),
      click: async () => {
        await browser.performCommand(window, 'toggle-mute', { tabId: tab.id });
      },
    },
    { type: 'separator' },
    {
      label: 'Add bookmark',
      icon: getIcon(EIcon.Bookmarks),
      enabled: !!tab.url && !tab.suspended,
      submenu: tab.url
        ? bookmarkFolderOptions(browser, window, tab.title, tab.url, 'root', 'Root', bookmarks.all)
        : [],
    },
    { type: 'separator' },
    {
      label: 'Add divider',
      icon: getIcon(EIcon.Divider),
      click: () => {
        browser.performCommand(window, 'add-divider', { tabContainerId: tabContainer.id });
      },
    },
    {
      label: 'Remove divider',
      click: () => {
        browser.performCommand(window, 'remove-divider', { tabContainerId: tabContainer.id });
      },
    },
    {
      label: 'Remove all dividers',
      click: () => {
        browser.performCommand(window, 'remove-all-dividers', { desktopId: desktop.id });
      },
    },
  ]);

  return menu;
}

function bookmarkFolderOptions(
  browser: Browser,
  window: Window,
  tabTitle: string,
  tabUrl: string,
  folderId: string,
  folderName: string,
  bookmarks: IBookmark[],
): MenuItemConstructorOptions[] {
  const folders = bookmarks.filter((b) => b.type === EBookmarkType.Folder);
  const foldersOptions: MenuItemConstructorOptions[] = folders.map((folder) => ({
    label: folder.title,
    icon: getIcon(EIcon.Folder),
    submenu: bookmarkFolderOptions(
      browser,
      window,
      tabTitle,
      tabUrl,
      folder.id,
      folder.title,
      folder.children,
    ),
  }));
  return [
    ...foldersOptions,
    { type: 'separator' },
    {
      label: 'Add here...',
      click: () => {
        window.modal.open('add-bookmark', {
          query: { title: tabTitle, url: tabUrl, folderId, folderName },
        });
      },
    },
    {
      label: 'Create folder here and add...',
      click: () => {
        window.modal.open('add-bookmark', {
          query: { title: tabTitle, url: tabUrl, folderId, folderName, createFolder: 'true' },
        });
      },
    },
  ];
}
