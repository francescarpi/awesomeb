import path from 'path';
import { BrowserWindow, WebContents, app, Rectangle } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { UILayout } from './layouts';
import { UIModalManager } from './modal';
import { UIView } from './view';
import { loadPage, openDevTools } from './helpers';
import { UINotificationsManager } from './notifications';
import { registerUIWindowEvents } from './events';
import EventEmitter from 'events';
import { UINewLayout } from './new-layout';
import log from 'electron-log';
import { UINewView } from './new-view';

const scopeLog = log.scope('UIWindow');

export class UIWindow {
  private rootLayout?: UILayout;
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

    registerUIWindowEvents(this);

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
    }

    this.refreshLayoutDeprecated();
  }

  refreshLayoutDeprecated() {
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

  toggleViewVisibility(id: string) {
    const view = this.getNode<UIView>(id);
    if (view) {
      if (view.isVisible) {
        view.hide();
      } else {
        view.show();
      }
      this.refreshLayoutDeprecated();
    }
  }

  setMargins(id: string, margins: Partial<{ l: number; t: number; r: number; b: number }>) {
    const view = this.getNode<UIView>(id);
    if (view) {
      view.setMargins(margins);
      this.refreshLayoutDeprecated();
    }
  }

  setWidth(id: string, width: number) {
    const view = this.getNode<UIView>(id);
    if (view) {
      view.setWidth(width);
      this.refreshLayoutDeprecated();
    }
  }

  setHeight(id: string, height: number) {
    const view = this.getNode<UIView>(id);
    if (view) {
      view.setHeight(height);
      this.refreshLayoutDeprecated();
    }
  }

  getNode<T>(id: string): T | null {
    return (this.rootLayout?.getNodeById(id) as T) || null;
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

  get bounds(): Rectangle {
    return this.bw.getBounds();
  }

  isViewChildOfContentView(view: UINewView): boolean {
    return this.bw.contentView.children.includes(view.webContentsView);
  }

  render(layout: UINewLayout, parentBounds: Rectangle) {
    if (typeof layout.type === 'string') {
      layout.setBounds(parentBounds);
      scopeLog.info(`Setting layout ${layout.id} bounds to`, parentBounds);
    }

    scopeLog.info('Layout children count:', layout.children.length);

    for (const child of layout.children) {
      if (child instanceof UINewLayout) {
        return this.render(child, layout.bounds);
      }

      child.setBounds({
        x: layout.bounds.x,
        y: layout.bounds.y,
        width: child.width || layout.bounds.width,
        height: child.height || layout.bounds.height,
      });

      scopeLog.info(`Setting view ${child.page} bounds to`, child.webContentsView.getBounds());

      if (!this.isViewChildOfContentView(child)) {
        this.bw.contentView.addChildView(child.webContentsView, 0);
      }
    }

    scopeLog.info('Rendered layout', layout.id, 'with', layout.children.length, 'children');
  }
}
