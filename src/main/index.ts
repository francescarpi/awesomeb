import { app } from 'electron';
import {
  Browser,
  setupCommandsIPC,
  setupBrowserIPC,
  setupDesktopIPC,
  setupWindowIPC,
} from '@/core';
import { setupUIIPC } from '@/ui';
import { setupLogs, setupAbout } from './boot';
import { registerAppEvents } from './events';
import { setupMenuIPC } from '@/menu';

export type { IModalProps } from './ui';

setupLogs();
setupAbout();

app.whenReady().then(() => {
  const browser = new Browser();

  setupUIIPC(browser);
  setupCommandsIPC(browser);
  setupBrowserIPC(browser);
  setupDesktopIPC(browser);
  setupWindowIPC(browser);
  setupMenuIPC(browser);

  browser.loadSession();

  registerAppEvents(browser);
});
