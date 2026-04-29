const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-execute2.js')
    }
  });
  win.loadURL('data:text/html,<script>const res = window.alert("hello"); console.log("RES:", res);</script>');
  win.webContents.on('console-message', (e, level, message) => {
    console.log('CONSOLE:', message);
  });
});
