import { Browser, Window, Desktop } from '@/core';
import { Menu } from 'electron';
import { EIcon, getIcon } from './utils';

export function desktopMenu(browser: Browser, window: Window, desktop: Desktop): Menu {
  const { desktops, selectedDesktop } = window;

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
          query: { desktopId: desktop.id.toString() },
        });
      },
    },
    {
      label: 'Change theme',
      icon: getIcon(EIcon.Theme),
      click: () => {
        window.modal.open('desktop-theme', {
          query: { desktopId: desktop.id.toString() },
        });
      },
    },
    { type: 'separator' },
    {
      label: 'Move left',
      icon: getIcon(EIcon.Previous),
      click: () => {
        browser.performCommand(window, 'move-desktop-left');
      },
    },
    {
      label: 'Move right',
      icon: getIcon(EIcon.Next),
      click: () => {
        browser.performCommand(window, 'move-desktop-right');
      },
    },
    { type: 'separator' },
    ...desktops.map((d) => ({
      label: d.label,
      enabled: d.id !== selectedDesktop.id,
      click: () => {
        browser.performCommand(window, 'select-desktop', { desktopId: d.id });
      },
    })),
  ]);

  return menu;
}
