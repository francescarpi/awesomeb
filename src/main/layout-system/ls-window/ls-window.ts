import { BrowserWindow, app } from 'electron';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';
import path from 'path';
import { LSLayout } from '../ls-layout';

export class LSWindow extends BrowserWindow {
  private _layout: null | LSLayout = null;

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

  show() {
    super.show();
  }

  addLayout(layout: LSLayout) {
    this._layout = layout;

    this._layout.refreshBounds(this.getBounds());

    for (const view of layout.views) {
      this.contentView.addChildView(view);
    }
  }
}
