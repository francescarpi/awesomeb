import {
  ContextMenuParams,
  MenuItemConstructorOptions,
  NavigationHistory,
  WebContents,
} from 'electron';
import { Actions } from 'electron-context-menu';
import { t } from '@/i18n';
import { EIcon, getIcon } from './utils';
import { createColorImage } from '@/utils';
import { Browser, partitions } from '@/core';
import type { IWinDesConTab } from '~/types';
import { MAX_SPLIT_TABS } from '~/constants';

export function tabWebContentsMenu(
  browser: Browser,
  tabData: IWinDesConTab,
  actions: Actions,
  params: ContextMenuParams,
  wc: WebContents,
  dictionarySuggestions: MenuItemConstructorOptions[],
): MenuItemConstructorOptions[] {
  const res: MenuItemConstructorOptions[] = [
    ...openOptions(browser, tabData, params.linkURL),
    { type: 'separator' },
    ...navigationOptions(wc),
    { type: 'separator' },
    actions.copy({}),
    actions.copyLink({}),
    actions.paste({}),
    actions.cut({}),
    actions.separator(),
    actions.copyImage({}),
    actions.copyImageAddress({}),
    actions.saveImage({}),
    actions.separator(),
    actions.inspect(),
  ];

  if (params.misspelledWord && dictionarySuggestions.length > 0) {
    res.unshift(...dictionarySuggestions, actions.separator());
  }

  return res;
}

function navigationOptions(wc: WebContents): MenuItemConstructorOptions[] {
  const navigationHistory = wc.navigationHistory as NavigationHistory;
  const canGoBack = navigationHistory.canGoBack();
  const canGoForward = navigationHistory.canGoForward();

  return [
    {
      label: t('menu.contextWebContents.back'),
      enabled: canGoBack,
      icon: getIcon(EIcon.Back),
      click: () => navigationHistory.goBack(),
    },
    {
      label: t('menu.contextWebContents.forward'),
      icon: getIcon(EIcon.Forward),
      enabled: canGoForward,
      click: () => navigationHistory.goForward(),
    },
    {
      label: t('menu.contextWebContents.reload'),
      icon: getIcon(EIcon.Reload),
      enabled: true,
      click: () => wc.reload(),
    },
  ];
}

function openOptions(
  browser: Browser,
  tabData: IWinDesConTab,
  url: string,
): MenuItemConstructorOptions[] {
  if (url === '') {
    return [];
  }

  return [
    {
      label: t('menu.contextWebContents.openInNewTab'),
      icon: getIcon(EIcon.Open),
      click: () => {
        browser.openURL(url, { selectTab: true });
      },
    },
    {
      label: t('menu.contextWebContents.openInFollowingTab'),
      icon: getIcon(EIcon.Open),
      click: () => {
        browser.openURL(url, { selectTab: true, targetId: 'after-current' });
      },
    },
    {
      label: t('menu.contextWebContents.openInBackgroundTab'),
      icon: getIcon(EIcon.Open),
      click: () => {
        browser.openURL(url);
      },
    },
    {
      label: t('menu.contextWebContents.openInSplitView'),
      icon: getIcon(EIcon.Vertical),
      enabled: tabData.tabContainer.tabs.length < MAX_SPLIT_TABS,
      click: () => {
        browser.openURL(url, { selectTab: true, targetId: 'split-tab' });
      },
    },
    {
      label: t('menu.contextWebContents.openIn'),
      icon: getIcon(EIcon.Open),
      submenu: browser.renderer.targetsEntities(tabData.window).map((target) => ({
        label: target.label,
        submenu: partitions.all.map((par) => ({
          label: par.name,
          icon: createColorImage(par.color),
          click: () => {
            browser.openURL(url, {
              targetId: target.id,
              partitionId: par.id,
              selectTab: true,
            });
          },
        })),
      })),
    },
  ];
}
