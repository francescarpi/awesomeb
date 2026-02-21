import {
  ContextMenuParams,
  MenuItemConstructorOptions,
  NavigationHistory,
  WebContents,
} from 'electron';
import { Actions } from 'electron-context-menu';
import { EIcon, getIcon } from './utils';

export function tabWebContentsMenu(
  actions: Actions,
  params: ContextMenuParams,
  wc: WebContents,
  dictionarySuggestions: MenuItemConstructorOptions[],
): MenuItemConstructorOptions[] {
  const res: MenuItemConstructorOptions[] = [
    ...navigationOptions(wc),
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
