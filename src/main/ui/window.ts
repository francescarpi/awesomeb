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
import { TLayoutChildren, TViewId } from './types';
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

    // TODO rename margins to margin

    const sidebar = new UIPageView('sidebar', {
      width: SIDEBAR_DEFAULT_WIDTH,
      query: { winId: this.id.toString() },
      margins: '5',
    });

    const urlbar = new UIPageView('urlbar', {
      height: 32,
      query: { winId: this.id.toString() },
      margins: '5',
    });

    const noTab = new UIPageView('no-tab', {
      margins: '5',
    });

    this._tabContainerLayout = new UILayout('urlbar-and-tab', 'horizontal');

    this._tabContainerLayout.addChild(urlbar);
    this._tabContainerLayout.addChild(noTab);

    mainLayout.addChild(sidebar);
    mainLayout.addChild(this._tabContainerLayout);

    // TODO add notifications view with a fixed position over the main layout

    this.renderLayout();
  }

  renderLayout(parentLayout?: UILayout, parentBounds?: Rectangle) {
    const layout = parentLayout || this._rootLayout!;

    // If layout type is string, it means it's a standard layout (horizontal or vertical)
    // It doesn't have custom bounds, so we set its bounds to the parent bounds
    if (typeof layout.type === 'string') {
      const [width, height] = this.bw.getSize();
      const bounds = parentBounds || { x: 0, y: 0, width, height };
      layout.setBounds(bounds);
    }

    scopeLog.info('LAYOUT', layout.id, layout.bounds, layout.type);

    // Iterate over children and set their bounds
    let previousChild: TLayoutChildren | null = null;
    for (const child of layout.children) {
      scopeLog.info('PREVIOUS CHILS', previousChild ? previousChild.id : 'none');

      // If child is a layout, calculate its bounds based on the layout type
      // and the previous child's bounds (if any) and render it recursively
      if (child instanceof UILayout) {
        let bounds = layout.bounds;
        if (layout.type === 'vertical') {
          const x = previousChild
            ? previousChild.bounds.x + previousChild.bounds.width
            : layout.bounds.x;
          const y = layout.bounds.y;
          bounds = {
            x,
            y,
            width: layout.bounds.width - x,
            height: layout.bounds.height,
          };
        } else if (layout.type === 'horizontal') {
          const x = layout.bounds.x;
          const y = previousChild
            ? previousChild.bounds.y + previousChild.bounds.height
            : layout.bounds.y;
          bounds = {
            x,
            y,
            width: layout.bounds.width,
            height: layout.bounds.height - y,
          };
        }
        this.renderLayout(child, bounds);
        continue;
      }

      // child is a view

      if (!child.isVisible) {
        continue;
      }

      let bounds = { x: 0, y: 0, width: 100, height: 100 };
      if (layout.type === 'vertical') {
        // bounds without margin
        bounds = {
          x: layout.bounds.x,
          y: layout.bounds.y,
          width: child.width || layout.bounds.width,
          height: child.height || layout.bounds.height,
        };

        // TODO with margins
      } else if (layout.type === 'horizontal') {
        // bounds without margin
        const y = previousChild
          ? previousChild.bounds.y + previousChild.bounds.height
          : layout.bounds.y;
        bounds = {
          x: layout.bounds.x,
          y: y,
          width: child.width || layout.bounds.width,
          height: child.height || layout.bounds.height - y,
        };
      }

      child.setBounds(bounds);
      scopeLog.info('VIEW', child.id, child.bounds);

      if (!this.isViewChildOfContentView(child)) {
        this.bw.contentView.addChildView(child.webContentsView, 0);
      }

      previousChild = child;
    }
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
      this.renderLayout();
    }
  }

  setMargins(id: string, margins: string) {
    const view = this.getChild<UIView>(id);
    if (view) {
      view.setMargins(margins);
      this.renderLayout();
    }
  }

  setWidth(id: string, width: number) {
    const view = this.getChild<UIView>(id);
    if (view) {
      view.setWidth(width);
      this.renderLayout();
    }
  }

  setHeight(id: string, height: number) {
    const view = this.getChild<UIView>(id);
    if (view) {
      view.setHeight(height);
      this.renderLayout();
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

    this.renderLayout();
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

    this.renderLayout();
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

    this.renderLayout();
  }
}
