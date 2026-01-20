import { app } from 'electron';
import { Browser } from '@main/core';
import { setupLayoutSystemIPC } from '@main/layout-system';
import { setupLogs } from './boot';

setupLogs();

function init() {
  const browser = new Browser();

  setupLayoutSystemIPC(browser);

  browser.init();

  const _w1 = browser.createWindow();
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
