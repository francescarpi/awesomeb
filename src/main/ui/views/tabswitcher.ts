import { TWindowId } from '~/types';
import { Window } from '@/core';
import { UIPageView } from '../view';

export class TabSwitcher extends UIPageView {
  constructor(winId: TWindowId) {
    super('tab-switcher', 'browser', {
      query: { winId: winId.toString() },
      visible: false,
    });
  }

  refreshBounds(window: Window) {
    const windowBounds = window.bounds;

    const width = 400;
    const height = 500;
    const x = Math.round((windowBounds.width - width) / 2);
    const y = Math.round((windowBounds.height - height) / 2);

    this.webContentsView.setBounds({
      x,
      y,
      width,
      height,
    });
  }
}
