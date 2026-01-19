import { app } from 'electron';
import { BrowserWindow } from '@main/core';

function init() {
  const w1 = new BrowserWindow();
  const w2 = new BrowserWindow();
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
