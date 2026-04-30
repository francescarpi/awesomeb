import path from 'path';
import { BrowserWindow, WebContents, app, Rectangle } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { UIModalManager } from './modal';
import { loadPage, openDevTools } from './helpers';
import EventEmitter from 'events';
import { partitions, Window } from '@/core';
import { UIView } from './view';
import { TViewId } from './types';
import { Sidebar, URLBar, TabSwitcher, TabMarks } from './views';
import log from 'electron-log';
import type { TWindowId } from '~/types';

const scopeLog = log.scope('UIWindow');

export class UIWindow {
  public readonly bw: BrowserWindow;
  private readonly _modalManager: UIModalManager;
  private readonly _views: Map<TViewId, UIView> = new Map();
  private _sidebarCollapsed = false;
  private _areaMaximized = false;
  private _fullScreen = false;

  constructor(
    public readonly winId: TWindowId,
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
        preload: path.join(PRELOAD_FOLDER, 'browser.preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        session: partitions.internal.ses,
      },
    });

    loadPage(this.bw.webContents, 'window', {
      winId: winId.toString(),
      sidebarCollapsed: this._sidebarCollapsed.toString(),
      areaMaximized: this._areaMaximized.toString(),
    });

    this._modalManager = new UIModalManager(this);

    openDevTools(this.webContents, 'window');

    this.buildLayout();
  }

  private buildLayout() {
    this.addView(new Sidebar(this.winId));
    this.addView(new URLBar(this.winId));
    this.addView(new TabSwitcher(this.winId));
    this.addView(new TabMarks(this.winId));
  }

  /**
   * Adds a view to the window. The view will be rendered on top of the main content.
   * @param view The view to add.
   * @param props Optional properties for the view, such as zIndex. 0 by default, higher values will be rendered on top of lower values.
   */
  addView(view: UIView) {
    this._views.set(view.viewId, view);
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
      scopeLog.error(`View with id ${id} not found in window ${this.winId}`);
      return;
    }

    view.webContentsView.webContents.close();

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

  get modal(): UIModalManager {
    return this._modalManager;
  }

  get bounds(): Rectangle {
    return this.bw.getBounds();
  }

  toggleSidebar(window: Window) {
    this._sidebarCollapsed = !this._sidebarCollapsed;

    // Sidebar is loaded to send the theme parameters when the sidebar is toggled, so we need to load it again to apply the changes.
    this.reloadSidebar(window);

    this.eventsChannel.emit('window:layout-did-change', window);
  }

  get sidebarCollapsed(): boolean {
    return this._sidebarCollapsed;
  }

  toggleMaximizeArea(window: Window) {
    this._areaMaximized = !this._areaMaximized;
    this._sidebarCollapsed = this._areaMaximized;

    // Sidebar is loaded to send the theme parameters when the sidebar is toggled, so we need to load it again to apply the changes.
    this.reloadSidebar(window);

    this.eventsChannel.emit('window:layout-did-change', window);
  }

  reloadSidebar(window: Window) {
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

  showTabSwitcher() {
    const view = this.getView<TabSwitcher>('tab-switcher')!;

    // move to top
    this.bw.contentView.removeChildView(view.webContentsView);
    this.bw.contentView.addChildView(view.webContentsView);

    view.setVisible(true);
    view.focus();
  }

  get isTabSwitcherVisible(): boolean {
    const view = this.getView<TabSwitcher>('tab-switcher')!;
    return view.visible;
  }

  hideTabSwitcher() {
    const view = this.getView<TabSwitcher>('tab-switcher')!;
    view.setVisible(false);
  }

  showTabMarks() {
    const view = this.getView<TabMarks>('tab-marks')!;

    // move to top
    this.bw.contentView.removeChildView(view.webContentsView);
    this.bw.contentView.addChildView(view.webContentsView);

    view.send('tabmarks:change-visibility', true);
    view.setVisible(true);
    view.focus();
  }

  hideTabMarks() {
    const view = this.getView<TabMarks>('tab-marks')!;
    view.send('tabmarks:change-visibility', false);
    view.setVisible(false);
  }

  get isTabMarksVisible(): boolean {
    const view = this.getView<TabMarks>('tab-marks')!;
    return view.visible;
  }
}
