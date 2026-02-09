import { TWindowId } from '~/types';
import { Window } from '@/core';
import { UIPageView } from '../view';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH } from '../constants';

export class Sidebar extends UIPageView {
  constructor(winId: TWindowId) {
    super('sidebar', {
      query: { winId: winId.toString() },
    });
  }

  refreshBounds(window: Window) {
    const bounds = window.bounds;

    let width = 0;

    if (window.areaMaximized) {
      width = window.sidebarCollapsed ? 0 : SIDEBAR_DEFAULT_WIDTH;
    } else {
      width = window.sidebarCollapsed ? SIDEBAR_MIN_WIDTH : SIDEBAR_DEFAULT_WIDTH;
    }

    this.webContentsView.setBounds({
      x: 0,
      y: 0,
      width: width,
      height: bounds.height,
    });
  }
}
