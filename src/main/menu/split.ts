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
      label: 'Rotate tabs clockwise',
      icon: getIcon(EIcon.RotateRight),
      click: () => {},
    },
    {
      label: 'Rotate tabs counter-clockwise',
      icon: getIcon(EIcon.RotateLeft),
      click: () => {},
    },
    { type: 'separator' },
    {
      label: 'Unsplit tabs',
      icon: getIcon(EIcon.Unsplit),
      click: () => {},
    },
    { type: 'separator' },
  ]);
  return menu;
}
