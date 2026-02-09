import { TWindowId } from '~/types';
import { Window } from '@/core';
import { UIPageView } from '../view';
import { URLBAR_HEIGHT, MARGIN } from '../constants';

export class URLBar extends UIPageView {
  constructor(winId: TWindowId) {
    super('urlbar', {
      query: { winId: winId.toString() },
    });
  }

  refreshBounds(window: Window) {
    const sidebar = window.getView('sidebar')!;
    const bounds = window.bounds;

    let width = bounds.width - sidebar.width - MARGIN;
    let x = sidebar.width;
    if (window.areaMaximized) {
      x = MARGIN;
      width = bounds.width - MARGIN * 2;
    }

    this.webContentsView.setBounds({
      x,
      y: MARGIN,
      width,
      height: URLBAR_HEIGHT - MARGIN * 2,
    });
  }
}
