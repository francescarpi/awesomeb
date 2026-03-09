import { Sidebar, UIView, URLBar } from '@/ui';
import { session } from 'electron';
import { internalPartition, Window } from '@/core';
import { MARGIN } from '@/ui/constants';
import { FIND_IN_PAGE_VIEW_HEIGHT } from './constants';
import { Tab } from './tab';

export class TabView extends UIView {
  constructor(private readonly tab: Tab) {
    super(`tab-${tab.id}#`, tab.partition.id === internalPartition.id ? 'browser' : 'tab', {
      visible: false,
      borderRadius: 12,
      backgroundColor: '#ffffff',
      session: session.fromPartition(tab.partition.id),
    });
  }

  render(window: Window) {
    if (this.tab.isPreview) {
      const selectedTab = window.selectedTab;
      if (selectedTab?.tab.id === this.tab.parentTab?.id) {
        this.setVisible(true);
      } else {
        this.setVisible(false);
      }
    }

    const bounds = window.bounds;
    if (window.fullScreen) {
      this.webContentsView.setBounds({
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height,
      });
      this.webContentsView.setBorderRadius(0);
      return;
    }

    this.webContentsView.setBorderRadius(12);

    const sidebar = window.getView<Sidebar>('sidebar')!;
    const urlbar = window.getView<URLBar>('urlbar')!;

    let x = sidebar.left + sidebar.width;
    let y = urlbar.top + urlbar.height + MARGIN;
    let width = bounds.width - x - MARGIN;
    let height = bounds.height - y - MARGIN;

    if (window.areaMaximized) {
      x = MARGIN;
      width = bounds.width - MARGIN * 2;
    }

    if (this.tab.findInPage) {
      height -= FIND_IN_PAGE_VIEW_HEIGHT + MARGIN;
    }

    if (this.tab.isPreview) {
      x += 16;
      y += 16;
      width -= 65;
      height -= 16 * 2;
    }

    this.webContentsView.setBounds({
      x,
      y,
      width,
      height,
    });
  }
}
