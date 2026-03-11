import { UIPageView } from '@/ui';
import { Window } from '@/core';
import { Tab } from './tab';

const HEIGHT = 30;

export class URLInfoView extends UIPageView {
  constructor(
    private readonly tab: Tab,
    url: string,
  ) {
    super(`tab-${tab.id}#url-info`, 'browser', {
      query: {
        url,
      },
      page: 'url-info',
    });
  }

  render(_window: Window) {
    this.webContentsView.setBounds({
      x: this.tab.left,
      y: this.tab.top + this.tab.height - HEIGHT,
      width: 400,
      height: HEIGHT,
    });
  }
}
