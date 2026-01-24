import { app } from 'electron';
import { Browser, setupCommandsIPC } from '@/core';
import { setupUIIPC } from '@/ui';
import { setupLogs, setupAbout } from './boot';
import { registerAppEvents } from './events';

setupLogs();
setupAbout();

app.whenReady().then(() => {
  const browser = new Browser();

  setupUIIPC(browser);
  setupCommandsIPC(browser);

  browser.init();

  browser.createWindow();

  registerAppEvents(browser);
});
