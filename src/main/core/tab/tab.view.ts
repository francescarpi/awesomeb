import { Sidebar, UIView, URLBar } from '@/ui';
import { TPartitionId, TTabId } from '~/types';
import { session } from 'electron';
import { Window } from '@/core';
import { MARGIN } from '@/ui/constants';

export class TabView extends UIView {
  constructor(_id: TTabId, partitionId: TPartitionId) {
    super(`tab-${_id}`, {
      visible: false,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      session: session.fromPartition(partitionId),
    });
  }

  refreshBounds(window: Window) {
    // TODO calculate bounds based on number of tab container's tabs
    const sidebar = window.getView<Sidebar>('sidebar')!;
    const urlbar = window.getView<URLBar>('urlbar')!;
    const bounds = window.bounds;

    const x = sidebar.left + sidebar.width;
    const y = urlbar.top + urlbar.height + MARGIN;

    this.webContentsView.setBounds({
      x,
      y,
      width: bounds.width - x - MARGIN,
      height: bounds.height - y - MARGIN,
    });
  }
}
