import {
  ContextMenuParams,
  MenuItemConstructorOptions,
  NavigationHistory,
  WebContents,
} from 'electron';
import { Actions } from 'electron-context-menu';
import { EIcon, getIcon } from './utils';
import { createColorImage } from '@/utils';
import { Browser, Window, partitions } from '@/core';

export function tabWebContentsMenu(
  browser: Browser,
  window: Window,
  actions: Actions,
  params: ContextMenuParams,
  wc: WebContents,
  dictionarySuggestions: MenuItemConstructorOptions[],
): MenuItemConstructorOptions[] {
  const res: MenuItemConstructorOptions[] = [
    ...navigationOptions(wc),
    { type: 'separator' },
    ...openOptions(browser, window, params.linkURL),
    { type: 'separator' },
    actions.copy({}),
    actions.copyLink({}),
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
      label: 'Back',
      enabled: canGoBack,
      icon: getIcon(EIcon.Back),
      click: () => navigationHistory.goBack(),
    },
    {
      label: 'Forward',
      icon: getIcon(EIcon.Forward),
      enabled: canGoForward,
      click: () => navigationHistory.goForward(),
    },
    {
      label: 'Reload',
      icon: getIcon(EIcon.Reload),
      enabled: true,
      click: () => wc.reload(),
    },
  ];
}

function openOptions(browser: Browser, window: Window, url: string): MenuItemConstructorOptions[] {
  if (url === '') {
    return [];
  }

  return [
    {
      label: 'Open link...',
      icon: getIcon(EIcon.Open),
      submenu: browser.renderer.targetsEntities(window).map((target) => ({
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
