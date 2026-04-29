const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-execute.js')
    }
  });
  win.loadURL('data:text/html,<html><body><h1>Test</h1></body></html>');
  win.webContents.on('console-message', (e, level, message) => {
    console.log('CONSOLE:', message);
  });
});
