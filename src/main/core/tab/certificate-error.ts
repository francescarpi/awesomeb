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
    super(`tab-${tab.id}#certificate-error`, 'browser', {
      query: {
        tabId: tab.id.toString(),
        url,
        error,
      },
      page: 'tab-certificate-error',
    });
  }

  render(_window: Window) {
    this.webContentsView.setBounds({
      x: this.tab.view.left,
      y: this.tab.view.top,
      width: this.tab.view.width,
      height: this.tab.view.height,
    });
  }
}
