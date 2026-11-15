import { UIPageView, type IViewBoundsOptions } from '@/ui';
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

  refreshBounds(_window: Window, options?: IViewBoundsOptions) {
    // Use the tab's TARGET bounds: while the tab is animating, its live bounds
    // are the intermediate ones, and this overlay has to match the tab exactly.
    const tabBounds = this.tab.targetBounds;

    this.setBounds(
      {
        x: tabBounds.x,
        y: tabBounds.y,
        width: tabBounds.width,
        height: tabBounds.height,
      },
      options,
    );
  }
}
