import path from 'path';
import { BrowserWindow, WebContents, app, Rectangle } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
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
  private rootLayout?: UINewLayout;
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

  setRootLayout(layout: UINewLayout) {
    this.rootLayout = layout;
  }

  toggleViewVisibility(id: string) {
    const view = this.getNode<UIView>(id);
    if (view) {
      if (view.isVisible) {
        view.hide();
      } else {
        view.show();
      }
      this.render();
    }
  }

  setMargins(id: string, margins: Partial<{ l: number; t: number; r: number; b: number }>) {
    const view = this.getNode<UIView>(id);
    if (view) {
      view.setMargins(margins);
      this.render();
    }
  }

  setWidth(id: string, width: number) {
    const view = this.getNode<UIView>(id);
    if (view) {
      view.setWidth(width);
      this.render();
    }
  }

  setHeight(id: string, height: number) {
    const view = this.getNode<UIView>(id);
    if (view) {
      view.setHeight(height);
      this.render();
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

  render(initialLayout?: UINewLayout, initialParentBounds?: Rectangle) {
    let layout = initialLayout;
    let parentBounds = initialParentBounds;

    if (!layout) {
      layout = this.rootLayout!;
    }

    if (!parentBounds) {
      const { width, height } = this.bw.getBounds();
      parentBounds = { x: 0, y: 0, width, height };
    }

    if (typeof layout.type === 'string') {
      layout.setBounds(parentBounds);
    }

    let x = layout.bounds.x;
    let y = layout.bounds.y;

    for (const child of layout.children) {
      if (child instanceof UINewLayout) {
        const childBounds = {
          x,
          y,
          width: layout.bounds.width - x,
          height: layout.bounds.height - y,
        };
        return this.render(child, childBounds);
      }

      child.setBounds({
        x: x + child.margins.l,
        y: y + child.margins.t,
        width: (child.width || layout.bounds.width) - child.margins.l - child.margins.r,
        height: (child.height || layout.bounds.height) - child.margins.t - child.margins.b - y,
      });

      // TODO evaluate if set a falg in view as "added"
      if (!this.isViewChildOfContentView(child)) {
        this.bw.contentView.addChildView(child.webContentsView, 0);
      }

      if (layout.type === 'horizontal') {
        y += child.bounds.height + child.margins.t + child.margins.b;
      } else if (layout.type === 'vertical') {
        x += child.bounds.width + child.margins.l + child.margins.r;
      }
    }

    scopeLog.info('Rendered layout', layout.id, 'with', layout.children.length, 'children');
  }
}
