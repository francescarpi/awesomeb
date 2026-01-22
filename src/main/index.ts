import { app } from 'electron';
import { Browser, setupWindowIPC } from '@main/core';
import { setupUIIPC } from '@main/ui';
import { setupLogs, setupAbout } from './boot';
import { registerAppEvents } from './events';

setupLogs();
setupAbout();

app.whenReady().then(() => {
  console.log('CREATOR PID', process.pid);

  const browser = new Browser();

  setupUIIPC(browser);
  setupWindowIPC(browser);

  browser.init();

  // browser.createWindow();
});

registerAppEvents();
