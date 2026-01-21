import path from 'path';
import { BrowserWindow, app } from 'electron';
import { PRELOAD_FOLDER } from '@main/utils';
import { UILayout } from './layouts';
import { UIView } from './view';
import { TPage } from '@shared/types';
import { UIModalManager } from './modal';
import { loadPage } from './helpers';
import { UINotificationsManager } from './notifications';

export class UIWindow extends BrowserWindow {
  private rootLayout?: UILayout;
  private readonly _views: Map<string, UIView> = new Map();

  private readonly _notificationsManager: UINotificationsManager;
  private readonly _modalManager: UIModalManager;

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

    loadPage(this.webContents, 'window');

    this._enableAutoLayout();

    this._modalManager = new UIModalManager(this);
    this._notificationsManager = new UINotificationsManager(this);

    // this.webContents.openDevTools();

    this.once('ready-to-show', () => {
      this.show();
    });
  }

  get wcId(): number {
    return this.webContents.id;
  }

  setLayout(layout: UILayout) {
    this.rootLayout = layout;

    this.contentView.addChildView(this.notifications.notificationContainer, 1);

    for (const view of this.rootLayout.views) {
      this.contentView.addChildView(view, 0);
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

    if (this.notifications.isVisible) {
      this.notifications.refreshContainerBounds();
    }
  }

  private _enableAutoLayout() {
    this.on('resize', () => this.refreshLayout());
    this.on('move', () => this.refreshLayout());
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

  get notifications(): UINotificationsManager {
    return this._notificationsManager;
  }

  get modal(): UIModalManager {
    return this._modalManager;
  }
}
