import path from 'path';
import { app } from 'electron';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';
import { BrowserWindow } from 'electron';
import { LSWindow } from '../window';
import { IProps } from './types';
import { TPage } from '@shared/types';

export class LSModal extends BrowserWindow {
  constructor(
    private readonly _parent: LSWindow,
    private readonly _page: TPage,
    private readonly _props?: IProps,
  ) {
    super({
      minWidth: 400,
      minHeight: 300,
      width: 400,
      height: 300,
      frame: false,
      parent: _parent,
      transparent: true,
      roundedCorners: true,
      modal: true,
      resizable: false,
      movable: false,
      webPreferences: {
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    if (app.isPackaged) {
      this.loadFile(path.join(RENDERER_FOLDER, _page, 'index.html'), {
        query: {
          winId: this._parent.id.toString(),
        },
      });
    } else {
      this.loadURL(`http://localhost:4321/${_page}?winId=${this._parent.id}`);
    }

    // this.webContents.openDevTools();
  }

  get wcId(): number {
    return this.webContents.id;
  }
}
