import { BrowserWindow, app } from 'electron';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';
import path from 'path';
import { LSLayout } from './layouts';

export class LSWindow extends BrowserWindow {
  private rootLayout?: LSLayout;

  constructor() {
    super({
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
      show: false,
      webPreferences: {
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    if (app.isPackaged) {
      this.loadFile(path.join(RENDERER_FOLDER, 'window', 'index.html'));
    } else {
      this.loadURL('http://localhost:4321/window');
    }

    // this.webContents.openDevTools();
  }

  get wcId(): number {
    return this.webContents.id;
  }

  setLayout(layout: LSLayout) {
    this.rootLayout = layout;
    this.refreshLayout();
  }

  refreshLayout() {
    if (!this.rootLayout) return;

    const [w, h] = this.getContentSize();

    this.rootLayout.layout({
      x: 0,
      y: 0,
      width: w,
      height: h,
    });
  }

  enableAutoLayout() {
    this.on('resize', () => this.refreshLayout());
    this.on('move', () => this.refreshLayout());
  }

  show() {
    super.show();
  }
}
