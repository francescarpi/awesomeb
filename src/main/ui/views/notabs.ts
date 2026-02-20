import { Window } from '@/core';
import { UIPageView } from '../view';
import { MARGIN } from '../constants';
import { Sidebar } from './sidebar';
import { URLBar } from './urlbar';

export class NoTabs extends UIPageView {
  constructor() {
    super('notabs', 'browser');
  }

  refreshBounds(window: Window) {
    if (window.activeTabs.length > 0) {
      this.webContentsView.setBounds({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      });
      return;
    }

    const sidebar = window.getView<Sidebar>('sidebar')!;
    const urlbar = window.getView<URLBar>('urlbar')!;
    const windowBounds = window.bounds;
    const y = urlbar.top + urlbar.height + MARGIN;

    let width = windowBounds.width - sidebar.width - MARGIN;
    let x = sidebar.width;
    if (window.areaMaximized) {
      x = MARGIN;
      width = windowBounds.width - MARGIN * 2;
    }

    this.webContentsView.setBounds({
      x,
      y,
      width,
      height: windowBounds.height - y - MARGIN,
    });
  }
}
