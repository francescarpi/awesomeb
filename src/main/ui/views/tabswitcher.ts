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
