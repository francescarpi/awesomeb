import { Browser, Window, Desktop } from '@/core';
import { Menu } from 'electron';
import { EIcon, getIcon } from './utils';

export function desktopMenu(browser: Browser, window: Window, desktop: Desktop): Menu {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Suspend all tabs',
      enabled: desktop.hasActiveTabs,
      icon: getIcon(EIcon.Suspend),
      click: () => {
        browser.performCommand(window, 'suspend-desktop', { desktopId: desktop.id });
      },
    },
    { type: 'separator' },
    {
      label: 'Rename',
      icon: getIcon(EIcon.Edit),
      click: () => {
        window.modal.open('rename-desktop', {
          height: 150,
          query: { desktopId: desktop.id.toString() },
        });
      },
    },
    {
      label: 'Change theme',
      icon: getIcon(EIcon.Theme),
      click: () => {
        window.modal.open('desktop-theme', {
          height: 500,
          query: { desktopId: desktop.id.toString() },
        });
      },
    },
  ]);

  return menu;
}
