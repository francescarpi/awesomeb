import path from 'path';
import { PRELOAD_FOLDER } from '@main/paths';
import { BrowserWindow } from 'electron';
import { UIWindow } from '../window';
import { TPage } from '@shared/types';
import { loadPage, openDevTools } from '../helpers';
import { IProps } from './types';

export class UIModal {
  public readonly bw: BrowserWindow;
  constructor(
    private readonly _parent: UIWindow,
    private readonly _page: TPage,
    props?: IProps,
  ) {
    this.bw = new BrowserWindow({
      width: props?.width || 400,
      height: props?.height || 400,
      frame: false,
      parent: _parent.bw,
      transparent: true,
      roundedCorners: true,
      modal: true,
      resizable: false,
      movable: false,
      show: false,
      webPreferences: {
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    const query = { winId: this._parent.id.toString() };
    loadPage(this.bw.webContents, this._page, query);

    openDevTools(this.bw.webContents, 'modal');

    this.bw.once('ready-to-show', () => {
      this.bw.show();
    });

    this.bw.once('closed', () => {
      this._parent.focus();
    });
  }

  get wcId(): number {
    return this.bw.webContents.id;
  }
}
