import path from 'path';
import { WebContentsView, Rectangle, app } from 'electron';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';
import { LSLayoutNode } from './types';
import { IMargins, TPage } from '@shared/types';

export class LSView extends WebContentsView implements LSLayoutNode {
  private _margins: IMargins = { l: 0, t: 0, r: 0, b: 0 };
  private _width: number | undefined;
  private _height: number | undefined;

  constructor(
    public readonly page: TPage,
    props?: { width?: number; height?: number; margin?: IMargins },
  ) {
    super({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
        webSecurity: true,
        transparent: true,
      },
    });

    if (app.isPackaged) {
      this.webContents.loadFile(path.join(RENDERER_FOLDER, page, 'index.html'));
    } else {
      this.webContents.loadURL(`http://localhost:4321/${page}`);
    }

    this._width = props?.width;
    this._height = props?.height;

    if (props?.margin) {
      this._margins = props.margin;
    }
  }

  layout(rect: Rectangle) {
    this.setBounds(rect);
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
