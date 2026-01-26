import path from 'path';
import { WebContentsView, Rectangle } from 'electron';
import { PRELOAD_FOLDER } from '@/paths';
import { ILayoutNode, IViewProps, IPageViewProps } from './types';
import { IMargins, TPage } from '~/types';
import { loadPage, openDevTools } from './helpers';

export class UIView implements ILayoutNode {
  private _margins: IMargins = { l: 0, t: 0, r: 0, b: 0 };
  private _width: number | undefined;
  private _height: number | undefined;
  public readonly wcv: WebContentsView;

  constructor(
    public readonly id: string,
    props?: IViewProps,
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

  get isVisible() {
    return this.wcv.getVisible();
  }

  show() {
    this.wcv.setVisible(true);
  }

  hide() {
    this.wcv.setVisible(false);
  }

  send(channel: string, ...args: any[]) {
    this.wcv.webContents.send(channel, ...args);
  }
}

export class UIPageView extends UIView {
  constructor(
    public readonly page: TPage,
    props?: IPageViewProps,
  ) {
    super(page, props);

    loadPage(this.wcv.webContents, page, props?.query);
    openDevTools(this.wcv.webContents, page);
  }
}
