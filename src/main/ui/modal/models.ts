import path from 'path';
import { PRELOAD_FOLDER } from '@/paths';
import { BrowserWindow } from 'electron';
import { UIWindow } from '../window';
import { IContextualModalParams, TPage } from '~/types';
import { loadPage, openDevTools } from '../helpers';
import { IProps } from './types';
import { partitions, Window } from '@/core';
import { UIPageView } from '../view';

export class UIModal {
  public readonly bw: BrowserWindow;
  private readonly modal: boolean;

  constructor(
    private readonly parent: UIWindow,
    private readonly page: TPage,
    props?: IProps,
  ) {
    this.modal = props?.modal !== undefined ? props.modal : true;
    const parentBounds = this.parent.bw.getBounds();

    this.bw = new BrowserWindow({
      width: parentBounds.width,
      height: parentBounds.height,
      frame: false,
      parent: parent.bw,
      transparent: true,
      backgroundMaterial: 'none',
      backgroundColor: '#00000000',
      roundedCorners: true,
      accentColor: '#00000000',
      hasShadow: false,
      resizable: false,
      movable: false,
      show: false,
      webPreferences: {
        preload: path.join(PRELOAD_FOLDER, 'browser.preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        session: partitions.internal.ses,
      },
    });

    const query = { winId: this.parent.winId.toString(), ...(props?.query || {}) };
    loadPage(this.bw.webContents, this.page, query);

    openDevTools(this.bw.webContents, 'modal');

    this.refreshBounds();

    this.bw.once('ready-to-show', () => {
      this.bw.show();
    });

    this.bw.once('closed', () => {
      this.parent.focus();
      parent.bw.off('move', this.refreshBounds);
    });

    parent.bw.on('move', this.refreshBounds);
  }

  private refreshBounds() {
    if (this.modal) {
      const parentBounds = this.parent.bw.getBounds();
      this.bw.setBounds({
        x: parentBounds.x,
        y: parentBounds.y,
        width: parentBounds.width,
        height: parentBounds.height,
      });
    } else {
      const parentBounds = this.parent.bw.getBounds();
      const modalBounds = this.bw.getBounds();
      const x = parentBounds.x + (parentBounds.width - modalBounds.width) / 2;
      const y = parentBounds.y + (parentBounds.height - modalBounds.height) / 2;
      this.bw.setBounds({ x, y, width: modalBounds.width, height: modalBounds.height });
    }
  }

  get wcId(): number {
    return this.bw.isDestroyed() ? -1 : this.bw.webContents.id;
  }
}

export class UIContextualModal extends UIPageView {
  constructor(win: UIWindow, page: TPage, props: IContextualModalParams) {
    super('contextual-modal', 'browser', {
      page,
      query: {
        winId: win.winId.toString(),
        x: props.bounds.x.toString(),
        y: props.bounds.y.toString(),
        width: props.bounds.width.toString(),
        height: props.bounds.height.toString(),
        anchor: props.anchor,
      },
    });
  }

  refreshBounds(window: Window) {
    const windowBounds = window.bounds;

    this.webContentsView.setBounds({
      x: 0,
      y: 0,
      width: windowBounds.width,
      height: windowBounds.height,
    });
  }
}
