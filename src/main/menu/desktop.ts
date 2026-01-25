import { Browser, Window, Desktop } from '@/core';
import { Menu } from 'electron';
import { EIcon, getIcon } from './utils';

export function desktopMenu(_browser: Browser, window: Window, desktop: Desktop): Menu {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Suspend all tabs',
      enabled: desktop.hasActiveTabs,
      // icon: getIcon(EIcon.Suspend),
      // click: () => {
      //   browser.performCommand({
      //     trigger: 'suspend-desktop-tabs',
      //     params: { windowId: window.id, desktopId: desktop.id },
      //   });
      // },
    },
    { type: 'separator' },
    {
      label: 'Rename desktop',
      icon: getIcon(EIcon.Edit),
      click: () => {
        window.modal.open('rename-desktop', {
          height: 150,
          query: { desktopId: desktop.id.toString() },
        });
      },
    },
  ]);

  return menu;
}
