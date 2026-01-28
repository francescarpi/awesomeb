import path from 'path';
import { BrowserWindow, WebContents, app, Rectangle, session } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { UIModalManager } from './modal';
import { getOnlyViews, loadPage, openDevTools } from './helpers';
import { UINotificationsManager } from './notifications';
import { registerUIWindowEvents } from './events';
import EventEmitter from 'events';
import { UILayout } from './layout';
import log from 'electron-log';
import { UIPageView, UIView } from './view';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH } from './constants';
import { TViewId } from './types';
import { internalPartition } from '@/core';

const scopeLog = log.scope('UIWindow');

export class UIWindow {
  private _rootLayout?: UILayout;
  private _tabContainerLayout?: UILayout;

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
        session: session.fromPartition(internalPartition.id),
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

    this._tabContainerLayout = new UILayout('urlbar-and-tab', 'horizontal');

    this._tabContainerLayout.addChild(urlbar);
    this._tabContainerLayout.addChild(noTab);

    mainLayout.addChild(sidebar);
    mainLayout.addChild(this._tabContainerLayout);

    // TODO add notifications view with a fixed position over the main layout

    this.render();
  }

  render(initialLayout?: UILayout, initialParentBounds?: Rectangle) {
    let layout = initialLayout;
    let parentBounds = initialParentBounds;

    if (!layout) {
      layout = this._rootLayout!;
    }

    if (!parentBounds) {
      const { width, height } = this.bw.getBounds();
      parentBounds = { x: 0, y: 0, width, height };
    }

    // If layout type is string, it means it's a standard layout (horizontal or vertical)
    // It doesn't have custom bounds, so we set its bounds to the parent bounds
    if (typeof layout.type === 'string') {
      layout.setBounds(parentBounds);
    }

    let x = layout.bounds.x;
    let y = layout.bounds.y;

    console.log(layout.id, layout.bounds, 'x', x, 'y', y);

    for (const child of layout.children) {
      if (child instanceof UILayout) {
        const childBounds = {
          x,
          y,
          width: layout.bounds.width - x + parentBounds.x,
          height: layout.bounds.height - y + parentBounds.y,
        };
        this.render(child, childBounds);
        continue;
      }

      // child is a view
      if (!child.isVisible) {
        continue;
      }

      const childWidth = child.width || layout.bounds.width;
      const childHeight = child.height || layout.bounds.height;

      console.log(child.id, 'w:', childWidth, 'h:', childHeight, child.margins);

      child.setBounds({
        x: x + child.margins.l,
        y: y + child.margins.t,
        width: childWidth - child.margins.l - child.margins.r,
        height: childHeight - child.margins.t - child.margins.b,
      });

      console.log(child.id, child.bounds);

      if (!this.isViewChildOfContentView(child)) {
        this.bw.contentView.addChildView(child.webContentsView, 0);
      }

      if (layout.type === 'horizontal') {
        y += child.bounds.y + child.bounds.height;
      } else if (layout.type === 'vertical') {
        x += child.bounds.x + child.bounds.width + child.margins.r;
      }

      console.log('Next pos x:', x, 'y:', y);
    }

    scopeLog.info('Rendered layout', layout.id, 'with', layout.children.length, 'children');
  }

  getChild<T>(id: TViewId, initialLayout?: UILayout): T | null {
    const layout = initialLayout || this._rootLayout!;

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
    this._rootLayout = layout;
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
    const noTabView = this.getChild<UIPageView>('no-tab', this._tabContainerLayout)!;

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

  addToTabContainerLayout(layout: UILayout) {
    this._tabContainerLayout!.addChild(layout);
  }

  refreshTabContainerLayoutView(visible: TViewId[]) {
    const views = getOnlyViews(this._tabContainerLayout!, ['urlbar']);

    // TODO remove no-tab.

    for (const view of views) {
      if (visible.includes(view.id)) {
        view.show();
      } else {
        view.hide();
      }
    }

    this.render();
  }
}
