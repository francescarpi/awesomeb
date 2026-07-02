import { UIPageView, UIView, Sidebar, loadPage } from '@/ui';
import { Window, Partition, windowOpenHadler, Browser } from '@/core';
import { TWindowId } from '~/types';
import { type HandlerDetails } from 'electron';

export class ExtensionPopupOverlay extends UIPageView {
  constructor(winId: TWindowId) {
    super('extension-popup-overlay', {
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
    browser: Browser,
    partition: Partition,
    private readonly x: number,
    private readonly y: number,
  ) {
    super('extension-popup', {
      session: partition.ses,
      backgroundColor: '#fff',
      visible: false,
    });

    this.webContents.on('did-finish-load', () => {
      this.webContents.insertCSS(
        'body { border: 1px solid rgba(0,0,0,0.5); box-sizing: border-box; height: 100vh; margin: 0 !important; }',
      );

      this.webContents.setWindowOpenHandler((details: HandlerDetails) => {
        return windowOpenHadler(browser, details, { skipParent: true });
      });
    });

    this.webContents.on('did-fail-load', (_event, _errorCode, _errorDescription, validatedURL) => {
      const url = new URL(validatedURL);
      loadPage(
        this.webContents,
        'extension-popup-failed',
        url.searchParams as unknown as Record<string, string>,
      );
    });

    // this.webContents.openDevTools({ mode: 'detach' });
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
