import path from 'path';
import { PRELOAD_FOLDER } from '@main/utils';
import { BrowserWindow } from 'electron';
import { UIWindow } from '../window';
import { TPage } from '@shared/types';
import { loadPage } from '../helpers';

export class UIModal extends BrowserWindow {
  constructor(
    private readonly _parent: UIWindow,
    private readonly _page: TPage,
  ) {
    super({
      width: 400,
      height: 300,
      frame: false,
      parent: _parent,
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
    loadPage(this.webContents, this._page, query);

    // this.webContents.openDevTools();

    this.once('ready-to-show', () => {
      this.show();
    });
  }

  get wcId(): number {
    return this.webContents.id;
  }
}
