import { ContextMenuParams, MenuItemConstructorOptions } from 'electron';
import { Actions } from 'electron-context-menu';

export function tabWebContentsMenu(
  actions: Actions,
  params: ContextMenuParams,
  dictionarySuggestions: MenuItemConstructorOptions[],
): MenuItemConstructorOptions[] {
  const res = [
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
