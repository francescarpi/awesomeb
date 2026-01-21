import path from 'path';
import { PRELOAD_FOLDER } from '@main/utils';
import { WebContentsView } from 'electron';
import { UIWindow } from '../window';
import { TNotificationSeverity } from '@shared/types';
import { loadPage } from '../helpers';
import { WIDTH, HEIGHT, MARGIN_TOP, MARGIN_RIGHT } from './constants';

export class UINotificationsContainer extends WebContentsView {
  constructor(private readonly _parent: UIWindow) {
    const parentBounds = _parent.getBounds();

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
      x: parentBounds.width - WIDTH - MARGIN_RIGHT,
      y: MARGIN_TOP,
      width: WIDTH,
      height: HEIGHT,
    });

    this.setVisible(false);

    loadPage(this.webContents, 'notifications', { winId: this._parent.id.toString() });

    // this.webContents.openDevTools();
  }

  get wcId(): number {
    return this.webContents.id;
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
