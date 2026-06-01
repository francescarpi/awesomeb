import { Browser, partitions } from '@/core';
import { loadPage, openDevTools } from '@/ui';
import { BrowserWindow, app } from 'electron';

export class WelcomeWindow {
  private readonly bw: BrowserWindow;

  constructor(_browser: Browser) {
    this.bw = new BrowserWindow({
      title: app.name,
      minWidth: 800,
      minHeight: 400,
      frame: false,
      visualEffectState: 'followWindow',
      transparent: false,
      resizable: true,
      backgroundMaterial: 'none',
      backgroundColor: process.platform === 'darwin' ? '#00000000' : '#000000',
      focusable: true,
      vibrancy: 'fullscreen-ui',
      roundedCorners: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        session: partitions.internal.ses,
      },
    });

    loadPage(this.bw.webContents, 'welcome', {});

    openDevTools(this.bw.webContents, 'welcome');
  }

  show() {
    this.bw.show();
  }

  get webContentsID(): number {
    return this.bw.webContents.id;
  }

  close() {
    this.bw.close();
  }
}
