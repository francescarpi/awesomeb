import { Menu, MenuItemConstructorOptions } from 'electron';
import { Browser, TabContainer, Layouts, Window } from '@/core';
import { getIcon, EIcon } from './utils';

export function splitMenu(browser: Browser, win: Window, tabContainer: TabContainer): Menu {
  const layouts: MenuItemConstructorOptions[] = Object.values(Layouts).map((layout) => ({
    label: layout.label,
    type: 'checkbox',
    checked: tabContainer.layout.id === layout.id,
    icon: layout.icon,
    click: () => {
      browser.performCommand(win, 'select-layout', { layout: layout.id });
    },
  }));

  const menu = Menu.buildFromTemplate([
    ...layouts,
    { type: 'separator' },
    {
      label: 'Swap tabs',
      icon: getIcon(EIcon.RotateRight),
      click: () => {
        browser.performCommand(win, 'swap-tabs', {});
      },
    },
    { type: 'separator' },
    {
      label: 'Unsplit tabs',
      icon: getIcon(EIcon.Unsplit),
      click: () => {
        browser.performCommand(win, 'unsplit-tabs', {});
      },
    },
    { type: 'separator' },
  ]);
  return menu;
}
