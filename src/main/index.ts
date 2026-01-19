import { app } from 'electron';
import { Browser } from '@main/core';
import { setupLogs } from './boot';

setupLogs();

function init() {
  const browser = new Browser();
  browser.init();

  const w1 = browser.createWindow();
  w1.show();

  // const w2 = browser.createWindow();
  // w2.show();
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
