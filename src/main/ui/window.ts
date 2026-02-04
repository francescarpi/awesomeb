import path from 'path';
import { BrowserWindow, WebContents, app, Rectangle, session } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { UIModalManager } from './modal';
import { loadPage, openDevTools } from './helpers';
import { UINotificationsManager } from './notifications';
import { registerUIWindowEvents } from './events';
import EventEmitter from 'events';
import { UILayout } from './layout';
import { UIPageView, UIView } from './view';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH } from './constants';
import { TLayoutChildren, TViewId } from './types';
import { internalPartition } from '@/core';
import { IMargin } from '~/types';
import { buildScopeLog } from '@/utils';

const scopeLog = buildScopeLog('UIWindow', process.env.AB_LOG_UI === 'true');

interface IFlexibleChildrenInfo {
  flexibleCount: number;
  availableSize: number;
}

export class UIWindow {
  private _rootLayout?: UILayout;

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
      winId: this.browserWindowId.toString(),
    });

    registerUIWindowEvents(this);

    this._modalManager = new UIModalManager(this);
    this._notificationsManager = new UINotificationsManager(this);

    openDevTools(this.webContents, 'window');

    this.buildLayout();
  }

  private buildLayout() {
    // ROOT LAYOUT --------------------------------------------------------
    const rootLayout = new UILayout('root-layout', 'vertical');
    this.setRootLayout(rootLayout);

    // SIDEBAR ------------------------------------------------------------
    const sidebar = new UIPageView('sidebar', {
      width: SIDEBAR_DEFAULT_WIDTH,
      query: { winId: this.browserWindowId.toString() },
    });

    // TODO add sidebar as a layout, later
    // TODO Review this, because if is added as a layout, as layout haven't a width, the layout grows to full size
    // const sidebarLayout = new UILayout('sidebar-layout', 'vertical');
    // sidebarLayout.addChild(sidebar);

    // URL BAR ------------------------------------------------------------
    const urlbar = new UIPageView('urlbar', {
      height: 32,
      query: { winId: this.browserWindowId.toString() },
      margin: '5 5 0 0',
    });

    // NO TAB -------------------------------------------------------------
    const noTab = new UIPageView('no-tab', { margin: '5 5 5 0' });

    // MAIN LAYOUT --------------------------------------------------------
    // This layout contains urlbar and tab container
    const mainLayout = new UILayout('main-layout', 'horizontal');
    mainLayout.addChild(urlbar);
    mainLayout.addChild(noTab);

    // --------------------------------------------------------------------
    rootLayout.addChild(sidebar);
    rootLayout.addChild(mainLayout);

    this.renderLayout();
  }

  renderLayout(parentLayout?: UILayout, parentBounds?: Rectangle) {
    const layout = parentLayout || this._rootLayout!;

    this._setupLayoutBounds(layout, parentBounds);
    scopeLog.debug('LAYOUT', layout.id, layout.bounds, layout.type);

    this._renderLayoutChildren(layout);

    // Only clean up orphaned views when rendering from root
    if (!parentLayout) {
      this._cleanupOrphanedViews();
    }

    scopeLog.debug('BW: Total content views', this.bw.contentView.children.length);
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

  /**
   * Collect all views that should be in the layout tree
   */
  private _collectAllViewsInTree(layout?: UILayout): Set<UIView> {
    const views = new Set<UIView>();
    const currentLayout = layout || this._rootLayout!;

    for (const child of currentLayout.children) {
      if (child instanceof UILayout) {
        // Recursively collect views from child layouts
        const childViews = this._collectAllViewsInTree(child);
        childViews.forEach((view) => views.add(view));
      } else if (child instanceof UIView) {
        views.add(child);
      }
    }

    return views;
  }

  /**
   * Remove views from contentView that are no longer in the layout tree.
   * This is necessary when layouts are removed from the tree.
   */
  private _cleanupOrphanedViews() {
    const viewsInTree = this._collectAllViewsInTree();
    const viewsInContentView = this.bw.contentView.children;

    for (const webContentsView of viewsInContentView) {
      // Check if this webContentsView belongs to a view in our tree
      let foundInTree = false;
      for (const view of viewsInTree) {
        if (view.webContentsView === webContentsView) {
          foundInTree = true;
          break;
        }
      }

      // If not found in tree, remove it from contentView
      if (!foundInTree) {
        this.bw.contentView.removeChildView(webContentsView);
        scopeLog.debug('Cleaned up orphaned view from contentView');
      }
    }
  }

  /**
   * Calculate how many flexible children (layouts or views without explicit size)
   * exist in a parent layout and how much space they should share.
   *
   * For vertical layouts: flexible children are those without explicit width
   * For horizontal layouts: flexible children are those without explicit height
   *
   * @example
   * // Vertical layout with width=1000px containing:
   * // - UIView with width=200px (fixed)
   * // - UILayout (flexible)
   * // - UILayout (flexible)
   * // Result: 2 flexible children sharing 800px (400px each)
   *
   * @example
   * // Horizontal layout with height=600px containing:
   * // - UIView with height=50px (fixed)
   * // - UIView without height (flexible)
   * // - UILayout (flexible)
   * // - UILayout (flexible)
   * // Result: 3 flexible children sharing 550px (~183.33px each)
   */
  private _calculateFlexibleChildren(parentLayout: UILayout): IFlexibleChildrenInfo {
    if (typeof parentLayout.type !== 'string') {
      return { flexibleCount: 0, availableSize: 0 };
    }

    const isVertical = parentLayout.type === 'vertical';
    let flexibleCount = 0;
    let usedSpace = 0;

    for (const child of parentLayout.children) {
      if (child instanceof UILayout) {
        // Layouts are always flexible (they don't have explicit width/height)
        flexibleCount++;
      } else if (child instanceof UIView && child.visible) {
        // For vertical layout, check if view has explicit width
        // For horizontal layout, check if view has explicit height
        const hasExplicitSize = isVertical ? child.width !== null : child.height !== null;

        if (hasExplicitSize) {
          // Sum up the used space by fixed-size children
          const childSize = isVertical ? child.width! : child.height!;
          const childMargin = isVertical
            ? child.margin.l + child.margin.r
            : child.margin.t + child.margin.b;
          usedSpace += childSize + childMargin;
        } else {
          // This child is flexible
          flexibleCount++;
        }
      }
    }

    const totalAvailableSpace = isVertical ? parentLayout.bounds.width : parentLayout.bounds.height;
    const availableSize = totalAvailableSpace - usedSpace;

    return {
      flexibleCount,
      availableSize: Math.max(0, availableSize),
    };
  }

  private _renderLayoutChildren(layout: UILayout) {
    let previousChild: TLayoutChildren | null = null;
    const flexibleChildrenInfo = this._calculateFlexibleChildren(layout);

    for (let i = 0; i < layout.children.length; i++) {
      const child = layout.children[i];

      if (child instanceof UILayout) {
        this._renderChildLayout(layout, child, previousChild, flexibleChildrenInfo);
        // Layouts should also be considered as previousChild
        previousChild = child;
        continue;
      }
      const existsInContentView = this.isViewChildOfContentView(child);
      scopeLog.debug(
        'VIEW',
        child.id,
        'visible:',
        child.visible,
        'existsInContentView:',
        existsInContentView,
      );

      if (child.visible) {
        if (!existsInContentView) {
          this.bw.contentView.addChildView(child.webContentsView, 0);
          scopeLog.debug('Added view to contentView:', child.id);
        }

        this._renderChildView(layout, child, previousChild, flexibleChildrenInfo);
        previousChild = child;
      } else {
        if (existsInContentView) {
          this.bw.contentView.removeChildView(child.webContentsView);
          scopeLog.debug('Removed view from contentView:', child.id);
        }
      }
    }
  }

  private _renderChildLayout(
    parentLayout: UILayout,
    childLayout: UILayout,
    previousChild: TLayoutChildren | null,
    flexibleChildrenInfo: IFlexibleChildrenInfo,
  ) {
    const bounds = this._calculateLayoutBounds(parentLayout, previousChild, flexibleChildrenInfo);
    this.renderLayout(childLayout, bounds);
  }

  private _renderChildView(
    parentLayout: UILayout,
    view: UIView,
    previousChild: TLayoutChildren | null,
    flexibleChildrenInfo: IFlexibleChildrenInfo,
  ) {
    const bounds = this._calculateViewBounds(
      parentLayout,
      view,
      previousChild,
      flexibleChildrenInfo,
    );
    const boundsWithMargin = this._applyMarginToBounds(bounds, view.margin);
    view.setBounds(boundsWithMargin);
    // scopeLog.info('VIEW', view.id, view.bounds);
  }

  private _calculateLayoutBounds(
    parentLayout: UILayout,
    previousChild: TLayoutChildren | null,
    flexibleChildrenInfo: IFlexibleChildrenInfo,
  ): Rectangle {
    if (parentLayout.type === 'vertical') {
      return this._calculateVerticalLayoutBounds(parentLayout, previousChild, flexibleChildrenInfo);
    } else if (parentLayout.type === 'horizontal') {
      return this._calculateHorizontalLayoutBounds(
        parentLayout,
        previousChild,
        flexibleChildrenInfo,
      );
    }
    return parentLayout.bounds;
  }

  private _calculateViewBounds(
    parentLayout: UILayout,
    view: UIView,
    previousChild: TLayoutChildren | null,
    flexibleChildrenInfo: IFlexibleChildrenInfo,
  ): Rectangle {
    if (parentLayout.type === 'vertical') {
      return this._calculateVerticalViewBounds(
        parentLayout,
        view,
        previousChild,
        flexibleChildrenInfo,
      );
    } else if (parentLayout.type === 'horizontal') {
      return this._calculateHorizontalViewBounds(
        parentLayout,
        view,
        previousChild,
        flexibleChildrenInfo,
      );
    }
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  private _calculateVerticalLayoutBounds(
    parentLayout: UILayout,
    previousChild: TLayoutChildren | null,
    flexibleChildrenInfo: IFlexibleChildrenInfo,
  ): Rectangle {
    const x = previousChild
      ? previousChild.bounds.x +
        previousChild.bounds.width +
        this._getPreviousChildRightMargin(previousChild)
      : parentLayout.bounds.x;
    const remainingWidth = parentLayout.bounds.width - (x - parentLayout.bounds.x);

    // Calculate width based on flexible children count
    const width =
      flexibleChildrenInfo.flexibleCount > 0
        ? flexibleChildrenInfo.availableSize / flexibleChildrenInfo.flexibleCount
        : remainingWidth;

    return {
      x,
      y: parentLayout.bounds.y,
      width,
      height: parentLayout.bounds.height,
    };
  }

  private _calculateHorizontalLayoutBounds(
    parentLayout: UILayout,
    previousChild: TLayoutChildren | null,
    flexibleChildrenInfo: IFlexibleChildrenInfo,
  ): Rectangle {
    const y = previousChild
      ? previousChild.bounds.y +
        previousChild.bounds.height +
        this._getPreviousChildBottomMargin(previousChild)
      : parentLayout.bounds.y;
    const remainingHeight = parentLayout.bounds.height - (y - parentLayout.bounds.y);

    // Calculate height based on flexible children count
    const height =
      flexibleChildrenInfo.flexibleCount > 0
        ? flexibleChildrenInfo.availableSize / flexibleChildrenInfo.flexibleCount
        : remainingHeight;

    return {
      x: parentLayout.bounds.x,
      y,
      width: parentLayout.bounds.width,
      height,
    };
  }

  private _calculateVerticalViewBounds(
    parentLayout: UILayout,
    view: UIView,
    previousChild: TLayoutChildren | null,
    flexibleChildrenInfo: IFlexibleChildrenInfo,
  ): Rectangle {
    const x = previousChild
      ? previousChild.bounds.x +
        previousChild.bounds.width +
        this._getPreviousChildRightMargin(previousChild)
      : parentLayout.bounds.x;
    const remainingWidth = parentLayout.bounds.width - (x - parentLayout.bounds.x);

    // If view has explicit width, use it; otherwise use shared width from flexible children
    let width = view.width;
    if (!width && flexibleChildrenInfo.flexibleCount > 0) {
      width = flexibleChildrenInfo.availableSize / flexibleChildrenInfo.flexibleCount;
    } else if (!width) {
      width = remainingWidth;
    }

    return {
      x,
      y: parentLayout.bounds.y,
      width,
      height: view.height || parentLayout.bounds.height,
    };
  }

  private _calculateHorizontalViewBounds(
    parentLayout: UILayout,
    view: UIView,
    previousChild: TLayoutChildren | null,
    flexibleChildrenInfo: IFlexibleChildrenInfo,
  ): Rectangle {
    const y = previousChild
      ? previousChild.bounds.y +
        previousChild.bounds.height +
        this._getPreviousChildBottomMargin(previousChild)
      : parentLayout.bounds.y;
    const remainingHeight = parentLayout.bounds.height - (y - parentLayout.bounds.y);

    // If view has explicit height, use it; otherwise use shared height from flexible children
    let height = view.height;
    if (!height && flexibleChildrenInfo.flexibleCount > 0) {
      height = flexibleChildrenInfo.availableSize / flexibleChildrenInfo.flexibleCount;
    } else if (!height) {
      height = remainingHeight;
    }

    return {
      x: parentLayout.bounds.x,
      y,
      width: view.width || parentLayout.bounds.width,
      height,
    };
  }

  private _applyMarginToBounds(bounds: Rectangle, margin: IMargin): Rectangle {
    return {
      x: bounds.x + margin.l,
      y: bounds.y + margin.t,
      width: bounds.width - margin.l - margin.r,
      height: bounds.height - margin.t - margin.b,
    };
  }

  private _getPreviousChildRightMargin(child: TLayoutChildren): number {
    return child instanceof UIView ? child.margin.r : 0;
  }

  private _getPreviousChildBottomMargin(child: TLayoutChildren): number {
    return child instanceof UIView ? child.margin.b : 0;
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

  get browserWindowId(): number {
    return this.bw.id;
  }

  get webContentsId(): number {
    return this.webContents.id;
  }

  get webContents(): WebContents {
    return this.bw.webContents;
  }

  setRootLayout(layout: UILayout) {
    this._rootLayout = layout;
  }

  toggleViewVisibility(id: string) {
    const view = this.getChild<UIView>(id);
    if (!view) {
      return;
    }

    if (view.visible) {
      view.setVisible(false);
    } else {
      view.setVisible(true);
    }

    this.renderLayout();
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

    if (urlbar.visible) {
      urlbar.setVisible(false);
      sidebar.setVisible(false);
    } else {
      urlbar.setVisible(true);
      sidebar.setVisible(true);
    }

    this.renderLayout();
  }

  get isAreaMaximized(): boolean {
    const urlbar = this.getChild<UIPageView>('urlbar')!;
    return !urlbar.visible;
  }

  addIntoMainLayout(layout: UILayout, withRender = true) {
    const mainLayout = this.getChild<UILayout>('main-layout')!;
    mainLayout.addChild(layout);
    scopeLog.debug('Added layout into main layout:', layout.id);
    if (withRender) {
      this.renderLayout();
    }
  }

  removeFromMainLayout(layout: UILayout) {
    const mainLayout = this.getChild<UILayout>('main-layout')!;
    mainLayout.removeChild(layout);
    scopeLog.debug('Removed layout from main layout:', layout.id);
    this.renderLayout();
  }

  setNoTabVisibility(visible: boolean) {
    const noTab = this.getChild<UIPageView>('no-tab')!;
    noTab.setVisible(visible);
  }
}
