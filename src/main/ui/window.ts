import path from 'path';
import { BrowserWindow, WebContents, app, Rectangle, session } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { UIModalManager } from './modal';
import { loadPage, openDevTools } from './helpers';
import { UINotificationsManager } from './notifications';
import EventEmitter from 'events';
import { internalPartition, Window } from '@/core';
import { UIView } from './view';
import { TViewId } from './types';
import { Sidebar, URLBar, NoTabs } from './views';

export class UIWindow {
  public readonly bw: BrowserWindow;
  private readonly _notificationsManager: UINotificationsManager;
  private readonly _modalManager: UIModalManager;
  private readonly _views: Map<TViewId, UIView> = new Map();
  private _sidebarCollapsed = false;
  private _areaMaximized = false;
  private _fullScreen = false;

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

    this._modalManager = new UIModalManager(this);
    this._notificationsManager = new UINotificationsManager(this);

    openDevTools(this.webContents, 'window');

    this.buildLayout();
  }

  private buildLayout() {
    const sidebar = new Sidebar(this.browserWindowId);
    this.addView(sidebar);

    const urlbar = new URLBar(this.browserWindowId);
    this.addView(urlbar);

    const noTabs = new NoTabs();
    this.addView(noTabs);

    this.addView(this.notifications.view);
  }

  /**
   * Adds a view to the window. The view will be rendered on top of the main content.
   * @param view The view to add.
   * @param props Optional properties for the view, such as zIndex. 0 by default, higher values will be rendered on top of lower values.
   */
  addView(view: UIView) {
    this._views.set(view.id, view);
    this.bw.contentView.addChildView(view.webContentsView);
  }

  moveViewToTop(id: TViewId) {
    const view = this._views.get(id);
    if (!view) {
      return;
    }

    this.bw.contentView.removeChildView(view.webContentsView);
    this.bw.contentView.addChildView(view.webContentsView);
  }

  removeView(id: TViewId) {
    const view = this._views.get(id);
    if (!view) {
      return;
    }

    this.bw.contentView.removeChildView(view.webContentsView);
    this._views.delete(id);
  }

  hasView(id: TViewId): boolean {
    return this._views.has(id);
  }

  getView<T>(id: TViewId): T | null {
    return (this._views.get(id) as T) || null;
  }

  get views(): UIView[] {
    return Array.from(this._views.values());
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

  toggleSidebar(window: Window) {
    this._sidebarCollapsed = !this._sidebarCollapsed;

    // Sidebar is loaded to send the theme parameters when the sidebar is toggled, so we need to load it again to apply the changes.
    const sidebar = this.getView<Sidebar>('sidebar')!;
    sidebar.loadPage(window);
  }

  get sidebarCollapsed(): boolean {
    return this._sidebarCollapsed;
  }

  toggleMaximizeArea(window: Window) {
    this._areaMaximized = !this._areaMaximized;
    this._sidebarCollapsed = this._areaMaximized;

    // Sidebar is loaded to send the theme parameters when the sidebar is toggled, so we need to load it again to apply the changes.
    const sidebar = this.getView<Sidebar>('sidebar')!;
    sidebar.loadPage(window);
  }

  get areaMaximized(): boolean {
    return this._areaMaximized;
  }

  setFullScreen(fullScreen: boolean) {
    if (this._fullScreen === fullScreen) {
      return;
    }
    this._fullScreen = fullScreen;
  }

  get fullScreen(): boolean {
    return this._fullScreen;
  }
}
