import { Menu } from 'electron';

export function minimumMenu() {
  return Menu.buildFromTemplate([
    {
      role: 'appMenu',
      submenu: [{ role: 'quit' }],
    },
  ]);
}
