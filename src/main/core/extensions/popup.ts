import { UIPageView, UIView } from '@/ui';
import { Window, Partition } from '@/core';
import { TWindowId } from '~/types';
import { session, screen } from 'electron';

export class ExtensionPopupOverlay extends UIPageView {
  constructor(winId: TWindowId) {
    super('extension-popup-overlay', 'browser', {
      query: { winId: winId.toString() },
    });
  }

  render(window: Window) {
    const windowBounds = window.bounds;

    this.webContentsView.setBounds({
      x: 0,
      y: 0,
      width: windowBounds.width,
      height: windowBounds.height,
    });
  }
}

export class ExtensionPopup extends UIView {
  constructor(partition: Partition) {
    super('extension-popup', 'extension', {
      session: session.fromPartition(partition.id),
      backgroundColor: '#fff',
      visible: false,
    });
  }

  render(window: Window) {
    const winBounds = window.bounds;
    const bounds = this.webContentsView.getBounds();
    const point = screen.getCursorScreenPoint();

    // calculate x, y to position the popup taking into account the anchor point is
    // the top-right corner of the popup
    const x = point.x - bounds.width - winBounds.x;
    const y = point.y - winBounds.y + 10;

    this.webContentsView.setBounds({
      x,
      y,
      width: bounds.width,
      height: bounds.height,
    });
  }
}
