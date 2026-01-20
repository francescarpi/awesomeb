import path from 'path';
import { PRELOAD_FOLDER } from '@main/utils';
import { BrowserWindow } from 'electron';
import { LSWindow } from '../window';
import { TNotificationSeverity } from './types';
import { loadPage } from '../helpers';

export class NotificationsContainer extends BrowserWindow {
  constructor(private readonly _parent: LSWindow) {
    const parentBounds = _parent.getBounds();
    const width = 250;
    const height = 80;
    const margin = 20;

    super({
      x: parentBounds.x + parentBounds.width - width - margin,
      y: parentBounds.y + margin,
      width,
      height,
      frame: false,
      parent: _parent,
      transparent: true,
      roundedCorners: true,
      resizable: false,
      movable: false,
      show: false,
      focusable: false,
      hasShadow: false,
      webPreferences: {
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    const query = {
      winId: this._parent.id.toString(),
    };
    loadPage(this.webContents, 'notifications', query);

    // this.webContents.openDevTools();
  }
}

export class Notification {
  constructor(
    public readonly message: string,
    public readonly severity: TNotificationSeverity,
  ) {}
}
