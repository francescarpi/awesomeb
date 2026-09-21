import { UIPageView, UIView, Sidebar, loadPage } from '@/ui';
import { Window, Partition, windowOpenHadler, Browser } from '@/core';
import { TExtensionId, TWindowId } from '~/types';
import { type HandlerDetails } from 'electron';
import { MAX_PREFERRED_SIZE_CHANGES, PREFERRED_SIZE_BURST_QUIET_PERIOD } from './constants';
import type { PopupPreferredSizeGuard } from './types';

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
  private preferredSizeGuard?: PopupPreferredSizeGuard;

  constructor(
    browser: Browser,
    partition: Partition,
    private readonly x: number,
    private readonly y: number,
    public readonly extensionId: TExtensionId,
  ) {
    super('extension-popup', {
      session: partition.ses,
      backgroundColor: '#fff',
      visible: false,
      preferredSizeMode: true,
    });

    this.webContents.on('did-finish-load', () => {
      this.webContents.insertCSS(
        'body { border: 1px solid rgba(0,0,0,0.5); box-sizing: border-box; margin: 0 !important; }',
      );

      this.webContents.setWindowOpenHandler((details: HandlerDetails) => {
        return windowOpenHadler(browser, details);
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
  }

  registerPreferredSizeEvent(window: Window) {
    this.resetPopupPreferredSizeGuard();

    this.webContents.on('preferred-size-changed', (_event, size) => {
      const width = Math.ceil(size.width);
      const height = Math.ceil(size.height);

      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0 ||
        (this.width === width && this.height === height)
      ) {
        return;
      }

      const guard = this.preferredSizeGuard || { changes: 0 };
      this.preferredSizeGuard = guard;

      if (guard.quietPeriodTimeout) {
        clearTimeout(guard.quietPeriodTimeout);
      }
      guard.quietPeriodTimeout = setTimeout(() => {
        guard.changes = 0;
        guard.quietPeriodTimeout = undefined;
      }, PREFERRED_SIZE_BURST_QUIET_PERIOD);

      if (guard.changes >= MAX_PREFERRED_SIZE_CHANGES) {
        return;
      }

      this.setSize(width, height);
      this.refreshBounds(window);
      this.setVisible(true);
      guard.changes += 1;
    });
  }

  private resetPopupPreferredSizeGuard() {
    if (this.preferredSizeGuard?.quietPeriodTimeout) {
      clearTimeout(this.preferredSizeGuard.quietPeriodTimeout);
    }
    this.preferredSizeGuard = undefined;
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
