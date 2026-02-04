import path from 'path';
import { PRELOAD_FOLDER } from '@/paths';
import { WebContentsView, session } from 'electron';
import { UIWindow } from '../window';
import { TNotificationSeverity } from '~/types';
import { loadPage } from '../helpers';
import { WIDTH, HEIGHT, MARGIN_TOP, MARGIN_RIGHT } from './constants';
import { internalPartition } from '@/core';

export class UINotificationsContainer extends WebContentsView {
  constructor(private readonly _parent: UIWindow) {
    super({
      webPreferences: {
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        transparent: true,
        session: session.fromPartition(internalPartition.id),
      },
    });

    this.refreshBounds();

    this.setVisible(false);

    loadPage(this.webContents, 'notifications', { winId: this._parent.browserWindowId.toString() });

    // this.webContents.openDevTools();
  }

  get wcId(): number {
    return this.webContents.id;
  }

  refreshBounds() {
    const parentBounds = this._parent.bw.getBounds();
    this.setBounds({
      x: parentBounds.width - WIDTH - MARGIN_RIGHT,
      y: MARGIN_TOP,
      width: WIDTH,
      height: HEIGHT,
    });
  }
}

export class UINotification {
  private readonly _id: string;

  constructor(
    public readonly message: string,
    public readonly severity: TNotificationSeverity,
  ) {
    this._id = crypto.randomUUID();
  }

  get id() {
    return this._id;
  }
}
