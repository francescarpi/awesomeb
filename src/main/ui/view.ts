import path from 'path';
import { WebContentsView, Rectangle } from 'electron';
import { PRELOAD_FOLDER } from '@main/utils';
import { ILayoutNode, IProps } from './types';
import { IMargins, TPage } from '@shared/types';
import { loadPage, openDevTools } from './helpers';

export class UIView implements ILayoutNode {
  private _margins: IMargins = { l: 0, t: 0, r: 0, b: 0 };
  private _width: number | undefined;
  private _height: number | undefined;
  public readonly wcv: WebContentsView;

  constructor(
    public readonly page: TPage,
    props?: IProps,
  ) {
    this.wcv = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
        webSecurity: true,
        transparent: true,
      },
    });

    loadPage(this.wcv.webContents, page, props?.query);

    openDevTools(this.wcv.webContents, page);

    this._width = props?.width;
    this._height = props?.height;

    if (props?.margin) {
      this._margins = props.margin;
    }
  }

  layout(rect: Rectangle) {
    this.wcv.setBounds(rect);
  }

  setMargins(margins: Partial<IMargins>) {
    this._margins = { ...this._margins, ...margins };
  }

  get margin() {
    return this._margins;
  }

  setWidth(width: number) {
    this._width = width;
  }

  get width() {
    return this._width;
  }

  setHeight(height: number) {
    this._height = height;
  }

  get height() {
    return this._height;
  }
}
