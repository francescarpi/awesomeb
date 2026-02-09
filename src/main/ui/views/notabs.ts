import { Window } from '@/core';
import { UIPageView } from '../view';
import { MARGIN } from '../constants';
import { Sidebar } from './sidebar';
import { URLBar } from './urlbar';

export class NoTabs extends UIPageView {
  constructor() {
    super('notabs');
  }

  refreshBounds(window: Window) {
    const sidebar = window.getView<Sidebar>('sidebar')!;
    const urlbar = window.getView<URLBar>('urlbar')!;
    const bounds = window.bounds;
    const y = urlbar.top + urlbar.height + MARGIN;

    let width = bounds.width - sidebar.width - MARGIN;
    let x = sidebar.width;
    if (window.areaMaximized) {
      x = MARGIN;
      width = bounds.width - MARGIN * 2;
    }

    this.webContentsView.setBounds({
      x,
      y,
      width,
      height: bounds.height - y - MARGIN,
    });
  }
}
