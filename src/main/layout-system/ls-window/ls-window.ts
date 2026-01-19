import { BrowserWindow, app } from 'electron';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';
import path from 'path';

export class LSWindow {
  private readonly _browserWindow: BrowserWindow;

  constructor() {
    this._browserWindow = new BrowserWindow({
      title: app.name,
      minWidth: 800,
      minHeight: 400,
      width: 800,
      height: 600,
      frame: false,
      visualEffectState: 'followWindow',
      transparent: false,
      resizable: true,
      backgroundMaterial: 'none',
      backgroundColor: process.platform === 'darwin' ? '#00000000' : '#000000',
      vibrancy: 'fullscreen-ui',
      roundedCorners: true,
      webPreferences: {
        preload: path.join(PRELOAD_FOLDER, 'index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    if (app.isPackaged) {
      this._browserWindow.loadFile(path.join(RENDERER_FOLDER, 'window', 'index.html'));
    } else {
      this._browserWindow.loadURL('http://localhost:4321/window');
    }

    this._browserWindow.webContents.openDevTools();
  }

  get id(): number {
    return this._browserWindow.id;
  }

  get wcId(): number {
    return this._browserWindow.webContents.id;
  }
}
