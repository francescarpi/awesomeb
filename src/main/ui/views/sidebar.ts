import { TWindowId } from '~/types';
import { Window } from '@/core';
import { UIPageView } from '../view';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH } from '../constants';
import { loadPage } from '../helpers';

export class Sidebar extends UIPageView {
  constructor(windowId: TWindowId) {
    super('sidebar', 'browser', {
      query: { winId: windowId.toString() },
    });
  }

  render(window: Window) {
    const bounds = window.bounds;

    let width: number;
    if (window.areaMaximized) {
      width = window.sidebarCollapsed ? 0 : SIDEBAR_DEFAULT_WIDTH;
    } else {
      width = window.sidebarCollapsed ? SIDEBAR_MIN_WIDTH : SIDEBAR_DEFAULT_WIDTH;
    }

    if (window.fullScreen) {
      width = 1;
    }

    this.webContentsView.setBounds({
      x: 0,
      y: 0,
      width,
      height: bounds.height,
    });
  }

  loadPage(window: Window) {
    const desktop = window.selectedDesktop;
    const theme: Record<string, string> =
      window.areaMaximized && !window.sidebarCollapsed
        ? {
            colorPrimary: desktop.theme.primary,
            colorSecondary: desktop.theme.secondary,
            degrees: desktop.theme.degrees.toString(),
          }
        : {};

    loadPage(this.webContents, 'sidebar', {
      winId: window.browserWindowId.toString(),
      ...theme,
    });
  }
}
