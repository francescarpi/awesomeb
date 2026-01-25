import path from 'path';
import { BrowserWindow, WebContents, app, Rectangle } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { UILayout } from './layouts';
import { UIView } from './view';
import { TPage } from '~/types';
import { UIModalManager } from './modal';
import { loadPage, openDevTools } from './helpers';
import { UINotificationsManager } from './notifications';
import { registerWindowEvents } from './events';
import EventEmitter from 'events';

export class UIWindow {
  private rootLayout?: UILayout;
  private readonly _views: Map<TPage, UIView> = new Map();
  public readonly bw: BrowserWindow;

  private readonly _notificationsManager: UINotificationsManager;
  private readonly _modalManager: UIModalManager;

  constructor(
    public readonly eventsChannel: EventEmitter,
    bounds?: Rectangle,
  ) {
    const windowBounds = bounds || {
      width: 1200,
      height: 800,
    };

    this.bw = new BrowserWindow({
      ...windowBounds,
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
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    loadPage(this.bw.webContents, 'window', {
      winId: this.id.toString(),
    });

    registerWindowEvents(this);

    this._modalManager = new UIModalManager(this);
    this._notificationsManager = new UINotificationsManager(this);

    openDevTools(this.wc, 'window');
  }

  get id(): number {
    return this.bw.id;
  }

  get wcId(): number {
    return this.wc.id;
  }

  get wc(): WebContents {
    return this.bw.webContents;
  }

  setLayout(layout: UILayout) {
    this.rootLayout = layout;

    this.bw.contentView.addChildView(this.notifications.notificationContainer, 1);

    for (const view of this.rootLayout.views) {
      this.bw.contentView.addChildView(view.wcv, 0);
      this._views.set(view.page, view);
    }

    this.refreshLayout();
  }

  refreshLayout() {
    if (!this.rootLayout) {
      return;
    }

    const [w, h] = this.bw.getContentSize();

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

  toggleViewVisibility(page: TPage) {
    const view = this._views.get(page);
    if (view) {
      if (view.isVisible) {
        view.hide();
      } else {
        view.show();
      }
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

  getView(page: TPage): UIView | null {
    return this._views.get(page) || null;
  }

  focus() {
    if (!this.bw.isDestroyed()) {
      this.bw.focus();
    }
  }

  show() {
    this.bw.show();
  }

  get notifications(): UINotificationsManager {
    return this._notificationsManager;
  }

  get modal(): UIModalManager {
    return this._modalManager;
  }

  performCommand() {
    this.modal.open('perform-command', {
      width: 500,
      height: 500,
    });
  }

  get bounds(): Rectangle {
    return this.bw.getBounds();
  }
}
