import { Menu, MenuItemConstructorOptions } from 'electron';

export function tabHistoryMenu(): Menu {
  let menu: MenuItemConstructorOptions[] = [
    { type: 'separator' },
    {
      label: 'Foo',
      // enabled: !tab.loading && !tab.suspended && tab.canGoForward,
      // icon: getIcon(EIcon.Forward),
      click: () => {
        // browser.performCommand(window, 'go-forward', { tabId: tab.id });
      },
    },
  ];
  return Menu.buildFromTemplate(menu);
}
