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

  checkVisibility(window: Window) {
    const selectedTab = window.selectedTab;
    if (
      selectedTab?.tab.id === this.tab.id ||
      selectedTab?.tab.tabPreview?.tab.id === this.tab.id
    ) {
      this.setVisible(true);
    } else {
      this.setVisible(false);
    }
  }

  refreshBounds(_window: Window) {
    this.webContentsView.setBounds({
      x: this.parent.left,
      y: this.parent.top,
      width: this.parent.width,
      height: this.parent.height,
    });
  }
}
