import { UIPageView, UIView, Sidebar } from '@/ui';
import { Window, Partition } from '@/core';
import { TWindowId } from '~/types';

export class ExtensionPopupOverlay extends UIPageView {
  constructor(winId: TWindowId) {
    super('extension-popup-overlay', 'browser', {
      query: { winId: winId.toString() },
    });
  }

  refreshBounds(window: Window) {
    const windowBounds = window.bounds;

    this.webContentsView.setBounds({
      x: 0,
      y: 0,
      width: windowBounds.width,
      height: windowBounds.height,
    });
  }
}

export class ExtensionPopup extends UIView {
  constructor(
    partition: Partition,
    private readonly x: number,
    private readonly y: number,
  ) {
    super('extension-popup', 'extension', {
      session: partition.ses,
      backgroundColor: '#fff',
      visible: false,
    });

    this.webContents.on('did-finish-load', () => {
      this.webContents.insertCSS(
        'body { border: 1px solid rgba(0,0,0,0.5); box-sizing: border-box; height: 100vh; margin: 0 !important; }',
      );
    });
  }

  refreshBounds(window: Window) {
    const bounds = this.webContentsView.getBounds();
    const sidebar = window.getView<Sidebar>('sidebar')!;

    const x = this.x + sidebar.bounds.width - bounds.width + 16;
    const y = this.y + 30;

    this.webContentsView.setBounds({
      x,
      y,
      width: bounds.width,
      height: bounds.height,
    });
  }
}
