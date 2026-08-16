import { Browser, bookmarks, Window, partitions } from '@/core';
import { Menu, MenuItemConstructorOptions } from 'electron';
import { t } from '@/i18n';
import { EIcon, getIcon } from './utils';
import { EBookmarkType, IBookmark, IWinDesConTab } from '~/types';
import { createColorImage } from '@/utils';

export function tabMenu(browser: Browser, tabInfo: IWinDesConTab): Menu {
  const { tab, window, tabContainer, desktop } = tabInfo;

  let menu: MenuItemConstructorOptions[] = [
    {
      label: t('menu.contextTab.reload'),
      enabled: !tab.loading && !tab.suspended,
      icon: getIcon(EIcon.Reload),
      click: () => {
        browser.performCommand(window, 'reload-tab', { tabId: tab.id });
      },
    },
    {
      label: t('menu.contextTab.goBack'),
      enabled: !tab.loading && !tab.suspended && tab.canGoBack,
      icon: getIcon(EIcon.Back),
      click: () => {
        browser.performCommand(window, 'go-back', { tabId: tab.id });
      },
    },
    {
      label: t('menu.contextTab.goForward'),
      enabled: !tab.loading && !tab.suspended && tab.canGoForward,
      icon: getIcon(EIcon.Forward),
      click: () => {
        browser.performCommand(window, 'go-forward', { tabId: tab.id });
      },
    },
    { type: 'separator' },
    {
      label: t('menu.contextTab.rename'),
      icon: getIcon(EIcon.Edit),
      click: () => {
        window.modal.open('rename-tab', {
          query: { tabId: tab.id.toString() },
        });
      },
    },
    { type: 'separator' },
    {
      label: t('menu.contextTab.copyUrl'),
      icon: getIcon(EIcon.Copy),
      click: async () => {
        await browser.performCommand(window, 'copy-url', { tabId: tab.id });
      },
    },
    { type: 'separator' },
    {
      label: t('menu.contextTab.move'),
      icon: getIcon(EIcon.Move),
      submenu: browser.renderer.targetsEntities(window).map((target) => ({
        label: target.label,
        click: async () => {
          await browser.performCommand(window, 'move-tab', { tabId: tab.id, targetId: target.id });
        },
      })),
    },
    {
      label: t('menu.contextTab.duplicate'),
      icon: getIcon(EIcon.Copy),
      submenu: browser.renderer.targetsEntities(window).map((target) => ({
        label: target.label,
        click: async () => {
          await browser.performCommand(window, 'duplicate-tab', {
            tabId: tab.id,
            targetId: target.id,
            partitionId: tab.partition.id,
          });
        },
      })),
    },
    {
      label: t('menu.contextTab.changeProfile'),
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
      label: t('menu.contextTab.suspend'),
      icon: getIcon(EIcon.Suspend),
      enabled: !tab.suspended,
      click: async () => {
        await browser.performCommand(window, 'suspend-tab', { tabId: tab.id });
      },
    },
    {
      label: t('menu.contextTab.close'),
      icon: getIcon(EIcon.Close),
      click: async () => {
        await browser.performCommand(window, 'close-tab', { tabId: tab.id });
      },
    },
    {
      label: t('menu.contextTab.closeBelow'),
      icon: getIcon(EIcon.Close),
      click: async () => {
        await browser.performCommand(window, 'close-tabs-below', { tabId: tab.id });
      },
    },
    { type: 'separator' },
    {
      label: tab.isMuted ? t('menu.contextTab.unmute') : t('menu.contextTab.mute'),
      icon: getIcon(tab.isMuted ? EIcon.Unmute : EIcon.Mute),
      click: async () => {
        await browser.performCommand(window, 'toggle-mute', { tabId: tab.id });
      },
    },
    { type: 'separator' },
    {
      label: t('menu.contextTab.addBookmark'),
      icon: getIcon(EIcon.Bookmarks),
      enabled: !!tab.url && !tab.suspended,
      submenu: tab.url
        ? bookmarkFolderOptions(browser, window, tab.title, tab.url, 'root', 'Root', bookmarks.all)
        : [],
    },
    { type: 'separator' },
    {
      label: t('menu.contextTab.addDivider'),
      icon: getIcon(EIcon.Divider),
      click: () => {
        browser.performCommand(window, 'add-divider', { tabContainerId: tabContainer.id });
      },
    },
    {
      label: t('menu.contextTab.removeDivider'),
      click: () => {
        browser.performCommand(window, 'remove-divider', { tabContainerId: tabContainer.id });
      },
    },
    {
      label: t('menu.contextTab.removeAllDividers'),
      click: () => {
        browser.performCommand(window, 'remove-all-dividers', { desktopId: desktop.id });
      },
    },
  ];

  if (tabContainer.parent === null) {
    menu = [
      ...menu,
      { type: 'separator' },
      {
        label: t('menu.contextTab.openTargetBlankAsChild'),
        type: 'checkbox',
        checked: tab.openTabsAsChild,
        click: async () => {
          await browser.performCommand(window, 'toggle-open-tabs-as-child', { tabId: tab.id });
        },
      },
      {
        label: t('menu.contextTab.collapseChildren'),
        type: 'checkbox',
        checked: tabContainer.childrenCollapsed,
        visible: tabContainer.children.length > 0,
        click: async () => {
          await browser.performCommand(window, 'toggle-collapse-children', {
            tabContainerId: tabContainer.id,
          });
        },
      },
    ];
  }

  if (tabContainer.hasChildren) {
    menu = [
      ...menu,
      {
        label: t('menu.contextTab.closeChildren'),
        icon: getIcon(EIcon.Close),
        click: async () => {
          await browser.performCommand(window, 'close-tab-children', {
            tabContainerId: tabContainer.id,
          });
        },
      },
    ];
  }

  return Menu.buildFromTemplate(menu);
}

function bookmarkFolderOptions(
  browser: Browser,
  window: Window,
  tabTitle: string,
  tabUrl: string,
  parentId: string,
  parentName: string,
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
      label: t('menu.contextTab.addHere'),
      click: () => {
        window.modal.open('add-bookmark', {
          query: { title: tabTitle, url: tabUrl, parentId, parentName },
        });
      },
    },
    {
      label: t('menu.contextTab.createFolderHere'),
      click: () => {
        window.modal.open('add-bookmark', {
          query: { title: tabTitle, url: tabUrl, parentId, parentName, createFolder: 'true' },
        });
      },
    },
  ];
}
