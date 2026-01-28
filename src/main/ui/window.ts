import path from 'path';
import { BrowserWindow, WebContents, app, Rectangle } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { UIModalManager } from './modal';
import { loadPage, openDevTools } from './helpers';
import { UINotificationsManager } from './notifications';
import { registerUIWindowEvents } from './events';
import EventEmitter from 'events';
import { UILayout } from './layout';
import log from 'electron-log';
import { UIPageView, UIView } from './view';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH } from './constants';

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

    this.buildLayout();
  }

  private buildLayout() {
    const mainLayout = new UILayout('main-layout', 'vertical');
    this.setRootLayout(mainLayout);

    const sidebar = new UIPageView('sidebar', {
      width: SIDEBAR_DEFAULT_WIDTH,
      query: { winId: this.id.toString() },
      margins: '5',
    });

    const urlbar = new UIPageView('urlbar', {
      height: 32,
      query: { winId: this.id.toString() },
      margins: '5 5 0 0',
    });

    const noTab = new UIPageView('no-tab', {
      margins: '5 5 5 0',
    });

    const urlbarWebviewLayout = new UILayout('urlbar-and-tab', 'horizontal');

    urlbarWebviewLayout.addChild(urlbar);
    urlbarWebviewLayout.addChild(noTab);

    mainLayout.addChild(sidebar);
    mainLayout.addChild(urlbarWebviewLayout);

    this.render();
  }

  getChild<T>(id: string | number, initialLayout?: UILayout): T | null {
    const layout = initialLayout || this.rootLayout!;

    if (layout.id === id) {
      return layout as T;
    }

    for (const child of layout.children) {
      if (child instanceof UILayout) {
        const foundInChild = this.getChild<T>(id, child);
        if (foundInChild) {
          return foundInChild;
        }
      } else if (child.id === id) {
        return child as T;
      }
    }

    return null;
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

  setRootLayout(layout: UILayout) {
    this.rootLayout = layout;
  }

  toggleViewVisibility(id: string) {
    const view = this.getChild<UIView>(id);
    if (view) {
      if (view.isVisible) {
        view.hide();
      } else {
        view.show();
      }
      this.render();
    }
  }

  setMargins(id: string, margins: string) {
    const view = this.getChild<UIView>(id);
    if (view) {
      view.setMargins(margins);
      this.render();
    }
  }

  setWidth(id: string, width: number) {
    const view = this.getChild<UIView>(id);
    if (view) {
      view.setWidth(width);
      this.render();
    }
  }

  setHeight(id: string, height: number) {
    const view = this.getChild<UIView>(id);
    if (view) {
      view.setHeight(height);
      this.render();
    }
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

  isViewChildOfContentView(view: UIView): boolean {
    return this.bw.contentView.children.includes(view.webContentsView);
  }

  render(initialLayout?: UILayout, initialParentBounds?: Rectangle) {
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
      if (child instanceof UILayout) {
        const childBounds = {
          x,
          y,
          width: layout.bounds.width - x,
          height: layout.bounds.height - y,
        };
        return this.render(child, childBounds);
      }

      // child is a view
      if (!child.isVisible) {
        continue;
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

  toggleSidebar() {
    // TODO if area is maximized, sidebar should appear over the main view

    const sidebar = this.getChild<UIPageView>('sidebar')!;
    if (sidebar.width === SIDEBAR_DEFAULT_WIDTH) {
      sidebar.setWidth(SIDEBAR_MIN_WIDTH);
    } else {
      sidebar.setWidth(SIDEBAR_DEFAULT_WIDTH);
    }

    this.render();
  }

  get isSidebarCollapsed(): boolean {
    const sidebar = this.getChild<UIPageView>('sidebar')!;
    return sidebar.width === SIDEBAR_MIN_WIDTH;
  }

  toggleMaximizeArea() {
    const urlbar = this.getChild<UIPageView>('urlbar')!;
    const sidebar = this.getChild<UIPageView>('sidebar')!;
    const noTabView = this.getChild<UIPageView>('no-tab')!;

    if (urlbar.isVisible) {
      urlbar.hide();
      sidebar.hide();
      noTabView.setMargins('5');
    } else {
      urlbar.show();
      sidebar.show();
      noTabView.setMargins('5 5 5 0');
    }

    this.render();
  }

  get isAreaMaximized(): boolean {
    const urlbar = this.getChild<UIPageView>('urlbar')!;
    return !urlbar.isVisible;
  }

  addToMainView(_layout: UILayout) {
    // const mainView = this.getChild<UIPageView>('main-view')!;
    // mainView.hide();
    // const rightContainer = this.getChild<UILayout>('urlbar-webview')!;
    // rightContainer.add(layout);
    //
    // this.render();
  }
}
