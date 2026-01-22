import path from 'path';
import { PRELOAD_FOLDER } from '@main/utils';
import { BrowserWindow } from 'electron';
import { UIWindow } from '../window';
import { TPage } from '@shared/types';
import { loadPage } from '../helpers';

export class UIModal {
  public readonly bw: BrowserWindow;
  constructor(
    private readonly _parent: UIWindow,
    private readonly _page: TPage,
  ) {
    this.bw = new BrowserWindow({
      width: 400,
      height: 300,
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

    // this.webContents.openDevTools();

    this.bw.once('ready-to-show', () => {
      this.bw.show();
    });
  }

  get wcId(): number {
    return this.bw.webContents.id;
  }
}
