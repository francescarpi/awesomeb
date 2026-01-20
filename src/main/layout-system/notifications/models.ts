import path from 'path';
import { PRELOAD_FOLDER } from '@main/utils';
import { WebContentsView } from 'electron';
import { LSWindow } from '../window';
import { TNotificationSeverity } from './types';
import { loadPage } from '../helpers';

export class NotificationsContainer extends WebContentsView {
  constructor(private readonly _parent: LSWindow) {
    const parentBounds = _parent.getBounds();
    const width = 250;
    const height = 80;
    const margin = 20;

    super({
      webPreferences: {
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        transparent: true,
      },
    });

    this.setBounds({
      x: parentBounds.x + parentBounds.width - width - margin,
      y: parentBounds.y + margin,
      width: width,
      height: height,
    });

    const query = {
      winId: this._parent.id.toString(),
    };

    loadPage(this.webContents, 'notifications', query);

    // this.webContents.openDevTools();
  }
}

export class Notification {
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
