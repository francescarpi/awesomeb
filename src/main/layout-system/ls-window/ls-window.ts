import { BrowserWindow, app } from 'electron';
import path from 'path';

export class LSWindow {
  private readonly _browserWindow: BrowserWindow;

  constructor() {
    this._browserWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    if (app.isPackaged) {
      this._browserWindow.loadFile(path.join(__dirname, '../renderer/window/index.html'));
    } else {
      this._browserWindow.loadURL('http://localhost:4321/window');
    }
  }
}
