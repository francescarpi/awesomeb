import { UIPageView } from '@/ui';
import { Tab } from './tab';
import { Window } from '@/core';

export class TabPreview extends UIPageView {
  constructor(
    private readonly parent: Tab,
    public readonly tab: Tab,
  ) {
    super(`tab-${parent.id}#preview`, 'browser', {
      query: {
        tabId: parent.id.toString(),
      },
      page: 'tab-preview',
    });
  }

  refreshBounds(_window: Window) {
    this.webContentsView.setBounds({
      x: this.parent.view.left,
      y: this.parent.view.top,
      width: this.parent.view.width,
      height: this.parent.view.height,
    });
  }
}
