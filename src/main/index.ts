import { app } from 'electron';
import { Browser, setupWindowIPC } from '@main/core';
import { setupUIIPC } from '@main/ui';
import { setupLogs, setupAbout } from './boot';

setupLogs();
setupAbout();

function init() {
  const browser = new Browser();

  setupUIIPC(browser);
  setupWindowIPC(browser);

  browser.init();

  browser.createWindow();
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
