import { UIPageView } from '@/ui';
import { Tab } from './tab';
import { Window } from '@/core';

export class CertificateError extends UIPageView {
  constructor(
    private readonly tab: Tab,
    url: string,
    error: string,
    public readonly callback: (isTrusted: boolean) => void,
  ) {
    super(`tab-${tab.id}#certificate-error`, {
      query: {
        tabId: tab.id.toString(),
        url,
        error,
      },
      page: 'tab-certificate-error',
    });
  }

  checkVisibility(window: Window) {
    const selectedTab = window.selectedTab;
    this.setVisible(selectedTab !== null && selectedTab.tab.id === this.tab.id);
  }

  refreshBounds(_window: Window) {
    this.webContentsView.setBounds({
      x: this.tab.left,
      y: this.tab.top,
      width: this.tab.width,
      height: this.tab.height,
    });
  }
}
