import path from 'path';
import { IMargin, TPage } from '~/types';
import { WebContentsView, Rectangle, WebContents, session } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { IViewProps, IPageViewProps, TViewId } from './types';
import { loadPage, openDevTools, transformMargin } from './helpers';
import { internalPartition } from '@/core';

export class UIView {
  protected readonly _webContentsView: WebContentsView;
  protected _margin: IMargin = { t: 0, r: 0, b: 0, l: 0 };
  protected _width: number | null = null;
  protected _height: number | null = null;

  constructor(props?: IViewProps) {
    this._webContentsView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: this.getPreloadScript(),
        webSecurity: true,
        transparent: true,
        session: session.fromPartition(internalPartition.id),
      },
    });

    this._webContentsView.setBorderRadius(props?.borderRadius || 0);

    this._margin = props?.margin ? transformMargin(props.margin) : this._margin;
    this._width = props?.width || null;
    this._height = props?.height || null;

    if (props?.visible || props?.visible === undefined) {
      this.show();
    } else {
      this.hide();
    }
  }

  get id(): TViewId {
    return this.webContents.id;
  }

  get webContentsId(): number {
    // Dont delete - used in some places
    return this.webContents.id;
  }

  protected getPreloadScript(): string {
    return path.join(PRELOAD_FOLDER, 'tab.js');
  }

  get webContentsView(): WebContentsView {
    return this._webContentsView;
  }

  get webContents(): WebContents {
    return this._webContentsView.webContents;
  }

  setBounds(bounds: Rectangle) {
    this._webContentsView.setBounds(bounds);
  }

  get bounds(): Rectangle {
    return this._webContentsView.getBounds();
  }

  get margin(): IMargin {
    return this._margin;
  }

  get isVisible(): boolean {
    return this.webContentsView.getVisible();
  }

  get width(): number | null {
    return this._width;
  }

  get height(): number | null {
    return this._height;
  }

  hide() {
    this.webContentsView.setVisible(false);
  }

  show() {
    this.webContentsView.setVisible(true);
  }

  setMargin(margin: string) {
    this._margin = transformMargin(margin);
  }

  setWidth(width: number) {
    this._width = width;
  }

  setHeight(height: number) {
    this._height = height;
  }

  send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }
}

export class UIPageView extends UIView {
  constructor(
    public readonly page: TPage,
    props?: IPageViewProps,
  ) {
    super(props);
    loadPage(this.webContents, page, props?.query);
    openDevTools(this.webContents, page);
  }

  protected getPreloadScript(): string {
    return path.join(PRELOAD_FOLDER, 'browser.js');
  }

  get id(): string {
    return this.page;
  }
}
