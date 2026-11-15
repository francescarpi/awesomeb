import { UIPageView, type IViewBoundsOptions } from '@/ui';
import { Tab } from './tab';
import { Window } from '@/core';

export class TabPreview extends UIPageView {
  constructor(
    private readonly parent: Tab,
    public readonly tab: Tab,
  ) {
    super(`tab-${parent.id}#preview`, {
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

  refreshBounds(_window: Window, options?: IViewBoundsOptions) {
    // Use the parent tab's TARGET bounds: while the tab is animating, its live
    // bounds are the intermediate ones, and this preview has to match it.
    const parentBounds = this.parent.targetBounds;

    this.setBounds(
      {
        x: parentBounds.x,
        y: parentBounds.y,
        width: parentBounds.width,
        height: parentBounds.height,
      },
      options,
    );
  }
}
