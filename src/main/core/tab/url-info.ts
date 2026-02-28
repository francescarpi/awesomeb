import { UIPageView } from '@/ui';
import { Window } from '@/core';
import { Tab } from './tab';

const HEIGHT = 30;

export class URLInfoView extends UIPageView {
  constructor(
    private readonly tab: Tab,
    url: string,
  ) {
    super(`url-info-${tab.id}`, 'browser', {
      query: {
        url,
      },
      page: 'url-info',
    });
  }

  refreshBounds(_window: Window) {
    this.webContentsView.setBounds({
      x: this.tab.view.left,
      y: this.tab.view.top + this.tab.view.height - HEIGHT,
      width: 400,
      height: HEIGHT,
    });
  }
}
