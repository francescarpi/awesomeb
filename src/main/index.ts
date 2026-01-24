import { app } from 'electron';
import { Browser, setupCommandsIPC, setupBrowserIPC, setupDesktopIPC } from '@/core';
import { setupUIIPC } from '@/ui';
import { setupLogs, setupAbout } from './boot';
import { registerAppEvents } from './events';

setupLogs();
setupAbout();

app.whenReady().then(() => {
  const browser = new Browser();

  setupUIIPC(browser);
  setupCommandsIPC(browser);
  setupBrowserIPC(browser);
  setupDesktopIPC(browser);

  browser.loadSession();

  registerAppEvents(browser);
});
