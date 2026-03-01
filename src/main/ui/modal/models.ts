import path from 'path';
import { PRELOAD_FOLDER } from '@/paths';
import { BrowserWindow, session } from 'electron';
import { UIWindow } from '../window';
import { TPage } from '~/types';
import { loadPage, openDevTools } from '../helpers';
import { IProps } from './types';
import { internalPartition } from '@/core';

export class UIModal {
  public readonly bw: BrowserWindow;
  constructor(
    private readonly _parent: UIWindow,
    private readonly _page: TPage,
    props?: IProps,
  ) {
    const modal = props?.modal !== undefined ? props.modal : true;

    this.bw = new BrowserWindow({
      width: props?.width || 400,
      height: props?.height || 400,
      frame: false,
      parent: _parent.bw,
      transparent: true,
      backgroundMaterial: 'none',
      backgroundColor: process.platform === 'darwin' ? '#00000000' : '#000000',
      roundedCorners: true,
      hasShadow: false,
      modal,
      resizable: false,
      movable: false,
      show: false,
      webPreferences: {
        preload: path.join(PRELOAD_FOLDER, 'browser.preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        session: session.fromPartition(internalPartition.id),
      },
    });

    const query = { winId: this._parent.browserWindowId.toString(), ...(props?.query || {}) };
    loadPage(this.bw.webContents, this._page, query);

    openDevTools(this.bw.webContents, 'modal');

    if (!modal) {
      const parentBounds = this._parent.bw.getBounds();
      const modalBounds = this.bw.getBounds();
      const x = parentBounds.x + (parentBounds.width - modalBounds.width) / 2;
      const y = parentBounds.y + (parentBounds.height - modalBounds.height) / 2;
      this.bw.setBounds({ x, y, width: modalBounds.width, height: modalBounds.height });
    }

    this.bw.once('ready-to-show', () => {
      this.bw.show();
    });

    this.bw.once('closed', () => {
      this._parent.focus();
    });
  }

  get wcId(): number {
    return this.bw.isDestroyed() ? -1 : this.bw.webContents.id;
  }
}
