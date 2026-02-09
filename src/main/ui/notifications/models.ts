import { TNotificationSeverity, TWindowId } from '~/types';
import { WIDTH, HEIGHT, MARGIN_TOP, MARGIN_RIGHT } from './constants';
import { Window } from '@/core';
import { UIPageView } from '../view';

export class UINotificationsView extends UIPageView {
  constructor(windowId: TWindowId) {
    super('notifications', {
      query: { winId: windowId.toString() },
      visible: false,
    });
  }

  refreshBounds(window: Window) {
    this.webContentsView.setBounds({
      x: window.bounds.width - WIDTH - MARGIN_RIGHT,
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
