import path from 'path';
import { TPage } from '~/types';
import { WebContentsView, Rectangle, WebContents } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { IViewProps, IPageViewProps } from './types';
import { loadPage, openDevTools } from './helpers';

export class UINewView {
  protected readonly _webContentsView: WebContentsView;

  constructor(private readonly _props?: IViewProps) {
    this._webContentsView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: this.getPreloadScript(),
        webSecurity: true,
        transparent: true,
      },
    });
  }

  protected getPreloadScript(): string {
    return path.join(PRELOAD_FOLDER, 'browser.js');
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

  get width(): number | null {
    return this._props?.width || null;
  }

  get height(): number | null {
    return this._props?.height || null;
  }
}

export class UINewPageView extends UINewView {
  constructor(
    public readonly page: TPage,
    props?: IPageViewProps,
  ) {
    super(props);
    loadPage(this.webContents, page, props?.query);
    openDevTools(this.webContents, page);
  }

  protected getPreloadScript(): string {
    return path.join(PRELOAD_FOLDER, 'tab.js');
  }
}
