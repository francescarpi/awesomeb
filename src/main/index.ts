import { app } from 'electron';
import { Browser } from '@main/core';
import { setupUIIPC } from '@main/ui';
import { setupLogs } from './boot';

setupLogs();

function init() {
  const browser = new Browser();

  setupUIIPC(browser);

  browser.init();

  browser.createWindow();
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
