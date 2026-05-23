import path from 'path';
import { WebContentsView, Rectangle, WebContents, Session } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { IViewProps, IPageViewProps, TViewId } from './types';
import { loadPage, openDevTools } from './helpers';
import { partitions, Window } from '@/core';
import { buildScopeLog } from '@/utils';

const scopeLog = buildScopeLog('UIView', process.env.AB_LOG_UI === 'true');

export class UIView {
  protected _webContentsView: WebContentsView;

  private readonly _borderRadius: number;
  private readonly _backgroundColor: string;

  private _session: Session;

  constructor(
    public readonly viewId: TViewId,
    private readonly preload: 'browser' | 'tab' | 'extension' = 'tab',
    props?: IViewProps,
  ) {
    this._borderRadius = props?.borderRadius || 0;
    this._backgroundColor = props?.backgroundColor || '#00000000';
    this._session = props?.session || partitions.internal.ses;

    this._webContentsView = this._createWebContentsView();

    const visible = props?.visible ?? true;
    this.setVisible(visible);
  }

  private _createWebContentsView(): WebContentsView {
    const wcv = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(PRELOAD_FOLDER, `${this.preload}.preload.js`),
        webSecurity: true,
        transparent: true,
        session: this._session,
      },
    });

    wcv.setBorderRadius(this._borderRadius);

    wcv.setBackgroundColor(this._backgroundColor);

    return wcv;
  }

  refreshWebContentsView() {
    this._webContentsView = this._createWebContentsView();
  }

  get webContentsId(): number {
    // Dont delete - used in some places
    if (this.webContents === undefined) {
      scopeLog.error('WebContents is undefined for view:', this.viewId);
      return -1;
    }

    return this.webContents.id;
  }

  get isDestroyed(): boolean {
    return this.webContents === undefined || this.webContents.isDestroyed();
  }

  get webContentsView(): WebContentsView {
    return this._webContentsView;
  }

  get webContents(): WebContents {
    return this._webContentsView.webContents;
  }

  get bounds(): Rectangle {
    return this._webContentsView.getBounds();
  }

  get width(): number {
    return this.bounds.width;
  }

  get height(): number {
    return this.bounds.height;
  }

  get top(): number {
    return this.bounds.y;
  }

  get left(): number {
    return this.bounds.x;
  }

  setWidth(width: number) {
    this._webContentsView.setBounds({ ...this.bounds, width });
  }

  setSize(width: number, height: number) {
    this._webContentsView.setBounds({ ...this.bounds, width, height });
  }

  get visible(): boolean {
    return this._webContentsView.getVisible();
  }

  setVisible(visible: boolean) {
    this._webContentsView.setVisible(visible);
  }

  send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }

  reload() {
    this.webContents.reload();
  }

  get canGoBack(): boolean {
    return this.webContents?.navigationHistory.canGoBack() || false;
  }

  get canGoForward(): boolean {
    return this.webContents?.navigationHistory.canGoForward() || false;
  }

  goBack() {
    if (this.canGoBack) {
      this.webContents.navigationHistory.goBack();
    }
  }

  goForward() {
    if (this.canGoForward) {
      this.webContents.navigationHistory.goForward();
    }
  }

  checkVisibility(_window: Window) {}

  refreshBounds(_window: Window) {
    throw new Error('Not implemented render for UIView');
  }

  close() {
    if (this.webContents !== undefined) {
      this.webContents.stop();
      this.webContents.close();
    }
  }

  focus() {
    if (this.webContents !== undefined) {
      this.webContents.focus();
    }
  }

  print() {
    if (this.webContents !== undefined) {
      this.webContents.print();
    }
  }
}

export class UIPageView extends UIView {
  constructor(id: TViewId, preload: 'browser' | 'tab', props?: IPageViewProps) {
    super(id, preload, props);

    loadPage(this.webContents, props?.page || id, props?.query);

    openDevTools(this.webContents, props?.page || id);
  }
}
