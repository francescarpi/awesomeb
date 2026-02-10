import { Sidebar, UIView, URLBar } from '@/ui';
import { TPartitionId, TTabId } from '~/types';
import { session } from 'electron';
import { Window } from '@/core';
import { MARGIN } from '@/ui/constants';

export class TabView extends UIView {
  constructor(tabId: TTabId, partitionId: TPartitionId) {
    super(`tab-${tabId}`, {
      visible: false,
      borderRadius: 12,
      backgroundColor: '#ffffff',
      session: session.fromPartition(partitionId),
    });
  }

  refreshBounds(window: Window) {
    // TODO calculate bounds based on number of tab container's tabs
    const sidebar = window.getView<Sidebar>('sidebar')!;
    const urlbar = window.getView<URLBar>('urlbar')!;
    const bounds = window.bounds;

    let x = sidebar.left + sidebar.width;
    const y = urlbar.top + urlbar.height + MARGIN;
    let width = bounds.width - x - MARGIN;

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
