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

    const sidebar = new UIPageView('sidebar', {
      width: SIDEBAR_DEFAULT_WIDTH,
      query: { winId: this.id.toString() },
      margin: '5',
    });

    const urlbar = new UIPageView('urlbar', {
      height: 32,
      query: { winId: this.id.toString() },
      margin: '5',
    });

    const noTab = new UIPageView('no-tab', {
      margin: '5',
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

    this._setupLayoutBounds(layout, parentBounds);
    scopeLog.info('LAYOUT', layout.id, layout.bounds, layout.type);

    this._renderLayoutChildren(layout);
  }

  private _setupLayoutBounds(layout: UILayout, parentBounds?: Rectangle) {
    // If layout type is string, it means it's a standard layout (horizontal or vertical)
    // It doesn't have custom bounds, so we set its bounds to the parent bounds
    if (typeof layout.type === 'string') {
      const [width, height] = this.bw.getSize();
      const bounds = parentBounds || { x: 0, y: 0, width, height };
      layout.setBounds(bounds);
    }
  }

  private _renderLayoutChildren(layout: UILayout) {
    let previousChild: TLayoutChildren | null = null;

    for (const child of layout.children) {
      if (child instanceof UILayout) {
        this._renderChildLayout(layout, child, previousChild);
      } else if (child.isVisible) {
        this._renderChildView(layout, child, previousChild);
        previousChild = child;
      }
    }
  }

  private _renderChildLayout(
    parentLayout: UILayout,
    childLayout: UILayout,
    previousChild: TLayoutChildren | null,
  ) {
    const bounds = this._calculateLayoutBounds(parentLayout, previousChild);
    this.renderLayout(childLayout, bounds);
  }

  private _renderChildView(
    parentLayout: UILayout,
    view: UIView,
    previousChild: TLayoutChildren | null,
  ) {
    const bounds = this._calculateViewBounds(parentLayout, view, previousChild);
    view.setBounds(bounds);
    scopeLog.info('VIEW', view.id, view.bounds);

    if (!this.isViewChildOfContentView(view)) {
      this.bw.contentView.addChildView(view.webContentsView, 0);
    }
  }

  private _calculateLayoutBounds(
    parentLayout: UILayout,
    previousChild: TLayoutChildren | null,
  ): Rectangle {
    if (parentLayout.type === 'vertical') {
      return this._calculateVerticalLayoutBounds(parentLayout, previousChild);
    } else if (parentLayout.type === 'horizontal') {
      return this._calculateHorizontalLayoutBounds(parentLayout, previousChild);
    }
    return parentLayout.bounds;
  }

  private _calculateViewBounds(
    parentLayout: UILayout,
    view: UIView,
    previousChild: TLayoutChildren | null,
  ): Rectangle {
    if (parentLayout.type === 'vertical') {
      return this._calculateVerticalViewBounds(parentLayout, view, previousChild);
    } else if (parentLayout.type === 'horizontal') {
      return this._calculateHorizontalViewBounds(parentLayout, view, previousChild);
    }
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  private _calculateVerticalLayoutBounds(
    parentLayout: UILayout,
    previousChild: TLayoutChildren | null,
  ): Rectangle {
    const x = previousChild
      ? previousChild.bounds.x + previousChild.bounds.width
      : parentLayout.bounds.x;
    const remainingWidth = parentLayout.bounds.width - (x - parentLayout.bounds.x);

    return {
      x,
      y: parentLayout.bounds.y,
      width: remainingWidth,
      height: parentLayout.bounds.height,
    };
  }

  private _calculateHorizontalLayoutBounds(
    parentLayout: UILayout,
    previousChild: TLayoutChildren | null,
  ): Rectangle {
    const y = previousChild
      ? previousChild.bounds.y + previousChild.bounds.height
      : parentLayout.bounds.y;
    const remainingHeight = parentLayout.bounds.height - (y - parentLayout.bounds.y);

    return {
      x: parentLayout.bounds.x,
      y,
      width: parentLayout.bounds.width,
      height: remainingHeight,
    };
  }

  private _calculateVerticalViewBounds(
    parentLayout: UILayout,
    view: UIView,
    previousChild: TLayoutChildren | null,
  ): Rectangle {
    const x = previousChild
      ? previousChild.bounds.x + previousChild.bounds.width
      : parentLayout.bounds.x;
    const remainingWidth = parentLayout.bounds.width - (x - parentLayout.bounds.x);

    return {
      x,
      y: parentLayout.bounds.y,
      width: view.width || remainingWidth,
      height: view.height || parentLayout.bounds.height,
    };
  }

  private _calculateHorizontalViewBounds(
    parentLayout: UILayout,
    view: UIView,
    previousChild: TLayoutChildren | null,
  ): Rectangle {
    const y = previousChild
      ? previousChild.bounds.y + previousChild.bounds.height
      : parentLayout.bounds.y;
    const remainingHeight = parentLayout.bounds.height - (y - parentLayout.bounds.y);

    return {
      x: parentLayout.bounds.x,
      y,
      width: view.width || parentLayout.bounds.width,
      height: view.height || remainingHeight,
    };
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

  setMargin(id: string, margin: string) {
    const view = this.getChild<UIView>(id);
    if (view) {
      view.setMargin(margin);
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

    if (urlbar.isVisible) {
      urlbar.hide();
      sidebar.hide();
    } else {
      urlbar.show();
      sidebar.show();
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
