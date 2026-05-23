import { TWindowId } from '~/types';
import { Window } from '@/core';
import { UIPageView } from '../view';

export class TabMarks extends UIPageView {
  constructor(winId: TWindowId) {
    super('tab-marks', 'browser', {
      query: { winId: winId.toString() },
      visible: false,
    });
  }

  refreshBounds(window: Window) {
    const windowBounds = window.bounds;

    const width = 400;
    const height = 400;
    const x = Math.round(windowBounds.width - width);
    const y = Math.round(windowBounds.height - height);

    this.webContentsView.setBounds({
      x,
      y,
      width,
      height,
    });
  }
}
