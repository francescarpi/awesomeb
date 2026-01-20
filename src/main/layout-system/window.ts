import { BrowserWindow, app } from 'electron';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';
import path from 'path';
import { LSLayout } from './layouts';
import { LSView } from './view';
import { TPage } from '@shared/types';

export class LSWindow extends BrowserWindow {
  private rootLayout?: LSLayout;
  private readonly _views: Map<string, LSView> = new Map();

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

    this._enableAutoLayout();

    // this.webContents.openDevTools();
  }

  get wcId(): number {
    return this.webContents.id;
  }

  setLayout(layout: LSLayout) {
    this.rootLayout = layout;

    for (const view of this.rootLayout.views) {
      this.contentView.addChildView(view);
      this._views.set(view.page, view);
    }

    this.refreshLayout();
  }

  refreshLayout() {
    if (!this.rootLayout) {
      return;
    }

    const [w, h] = this.getContentSize();

    this.rootLayout.layout({
      x: 0,
      y: 0,
      width: w,
      height: h,
    });
  }

  private _enableAutoLayout() {
    this.on('resize', () => this.refreshLayout());
    this.on('move', () => this.refreshLayout());
  }

  show() {
    super.show();
  }

  setViewVisibility(page: TPage, visible: boolean) {
    const view = this._views.get(page);
    if (view) {
      view.setVisible(visible);
      this.refreshLayout();
    }
  }

  setMargins(page: TPage, margins: Partial<{ l: number; t: number; r: number; b: number }>) {
    const view = this._views.get(page);
    if (view) {
      view.setMargins(margins);
      this.refreshLayout();
    }
  }

  setWidth(page: TPage, width: number) {
    const view = this._views.get(page);
    if (view) {
      view.setWidth(width);
      this.refreshLayout();
    }
  }

  setHeight(page: TPage, height: number) {
    const view = this._views.get(page);
    if (view) {
      view.setHeight(height);
      this.refreshLayout();
    }
  }
}
