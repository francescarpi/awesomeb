import { TNotificationSeverity } from '~/types';
import { UIWindow } from '../window';
import { UINotificationsView, UINotification } from './models';
import { refreshNotifications } from '../ipc';

export class UINotificationsManager {
  private _view: UINotificationsView;
  private _notifications: UINotification[] = [];

  constructor(private readonly _win: UIWindow) {
    this._view = new UINotificationsView(_win.browserWindowId);
  }

  show(message: string, type: TNotificationSeverity = 'info') {
    const notification = new UINotification(message, type);
    this._notifications.push(notification);

    refreshNotifications(this._view.webContents, this._win.browserWindowId, this._notifications);

    if (!this._view.visible) {
      this._win.moveViewToTop(this._view.id);
      this._view.setVisible(true);
    }
  }

  get all(): UINotification[] {
    return this._notifications;
  }

  deleteFirstNotification() {
    if (this._notifications.length === 0) {
      return;
    }

    this._notifications.shift();
  }

  get view(): UINotificationsView {
    return this._view;
  }

  get webContentsId(): number {
    return this._view.webContentsId;
  }

  hide() {
    this._view.setVisible(false);
  }

  get isVisible(): boolean {
    return this._view.visible;
  }
}
