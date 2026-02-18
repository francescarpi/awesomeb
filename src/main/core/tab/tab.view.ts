import { Sidebar, UIView, URLBar } from '@/ui';
import { TPartitionId, TTabId } from '~/types';
import { session } from 'electron';
import { internalPartition, Window } from '@/core';
import { MARGIN } from '@/ui/constants';
import { FIND_IN_PAGE_VIEW_HEIGHT } from './constants';

export class TabView extends UIView {
  constructor(
    private readonly tabId: TTabId,
    partitionId: TPartitionId,
  ) {
    super(`tab-${tabId}`, partitionId === internalPartition.id ? 'browser' : 'tab', {
      visible: false,
      borderRadius: 12,
      backgroundColor: '#ffffff',
      session: session.fromPartition(partitionId),
    });
  }

  refreshBounds(window: Window) {
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

    // TODO calculate bounds based on number of tab container's tabs
    const tabResult = window.getTab(this.tabId);
    if (!tabResult) {
      return;
    }

    const sidebar = window.getView<Sidebar>('sidebar')!;
    const urlbar = window.getView<URLBar>('urlbar')!;

    let x = sidebar.left + sidebar.width;
    const y = urlbar.top + urlbar.height + MARGIN;
    let width = bounds.width - x - MARGIN;
    let height = bounds.height - y - MARGIN;

    if (window.areaMaximized) {
      x = MARGIN;
      width = bounds.width - MARGIN * 2;
    }

    if (tabResult.tab.findInPage) {
      height -= FIND_IN_PAGE_VIEW_HEIGHT + MARGIN;
    }

    this.webContentsView.setBounds({
      x,
      y,
      width,
      height,
    });
  }
}
