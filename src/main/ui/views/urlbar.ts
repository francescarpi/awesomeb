import { TWindowId } from '~/types';
import { Window } from '@/core';
import { UIPageView } from '../view';
import { URLBAR_HEIGHT, MARGIN } from '../constants';
import { Sidebar } from './sidebar';

export class URLBar extends UIPageView {
  constructor(winId: TWindowId) {
    super('urlbar', 'browser', {
      query: { winId: winId.toString() },
    });
  }

  refreshBounds(window: Window) {
    if (window.fullScreen && this.webContentsView.getVisible()) {
      this.webContentsView.setVisible(false);
      return;
    } else if (!window.fullScreen && !this.webContentsView.getVisible()) {
      this.webContentsView.setVisible(true);
    }

    const sidebar = window.getView<Sidebar>('sidebar')!;
    const bounds = window.bounds;

    let height = URLBAR_HEIGHT - MARGIN * 2;
    let y = MARGIN;
    if (window.areaMaximized) {
      height = 0;
      y = 0;
    }

    this.webContentsView.setBounds({
      x: sidebar.width,
      y,
      width: bounds.width - sidebar.width - MARGIN,
      height,
    });
  }
}
