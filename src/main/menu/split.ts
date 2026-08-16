import { Menu, MenuItemConstructorOptions } from 'electron';
import { Browser, TabContainer, Layouts, Window, LAYOUT_SIZES } from '@/core';
import { t } from '@/i18n';
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
      label: t('menu.split.swapTabs'),
      icon: getIcon(EIcon.RotateRight),
      click: () => {
        browser.performCommand(win, 'swap-tabs', {});
      },
    },
    { type: 'separator' },
    {
      label: t('menu.split.unsplitTabs'),
      icon: getIcon(EIcon.Unsplit),
      click: () => {
        browser.performCommand(win, 'unsplit-tabs', {});
      },
    },
    { type: 'separator' },
    {
      label: t('menu.split.size'),
      icon: getIcon(EIcon.Size),
      submenu: LAYOUT_SIZES.map((size) => ({
        label: `${size}%`,
        type: 'checkbox',
        checked: tabContainer.layoutSize === size,
        click: () => {
          browser.performCommand(win, 'change-layout-size', { size });
        },
      })),
    },
  ]);
  return menu;
}
