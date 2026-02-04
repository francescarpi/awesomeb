import { TNotificationSeverity } from '~/types';
import { UIWindow } from '../window';
import { UINotificationsContainer, UINotification } from './models';
import { refreshNotifications } from '../ipc';

export class UINotificationsManager {
  private _notificationsContainer: UINotificationsContainer;
  private _notifications: UINotification[] = [];

  constructor(private readonly _win: UIWindow) {
    this._notificationsContainer = new UINotificationsContainer(_win);
  }

  show(message: string, type: TNotificationSeverity = 'info') {
    const notification = new UINotification(message, type);
    this._notifications.push(notification);

    refreshNotifications(
      this._notificationsContainer.webContents,
      this._win.browserWindowId,
      this._notifications,
    );

    if (!this._notificationsContainer.getVisible()) {
      this._notificationsContainer.setVisible(true);
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

  get notificationContainer(): UINotificationsContainer {
    return this._notificationsContainer;
  }

  get containerId(): number {
    return this._notificationsContainer.wcId;
  }

  hideContainer() {
    this._notificationsContainer.setVisible(false);
  }

  get isVisible(): boolean {
    return this._notificationsContainer.getVisible();
  }

  refreshContainerBounds() {
    this._notificationsContainer.refreshBounds();
  }
}
