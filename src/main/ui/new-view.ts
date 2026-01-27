import path from 'path';
import { IMargins, TPage } from '~/types';
import { WebContentsView, Rectangle, WebContents } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { IViewProps, IPageViewProps } from './types';
import { loadPage, openDevTools, transformMargin } from './helpers';

export class UINewView {
  protected readonly _webContentsView: WebContentsView;
  protected _margins: IMargins = { t: 0, r: 0, b: 0, l: 0 };

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

    if (_props?.margins) {
      this._margins = transformMargin(_props.margins);
    }
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

  get bounds(): Rectangle {
    return this._webContentsView.getBounds();
  }

  get width(): number | null {
    return this._props?.width || null;
  }

  get height(): number | null {
    return this._props?.height || null;
  }

  get margins(): IMargins {
    return this._margins;
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
