import { UIPageView, type IViewBoundsOptions } from '@/ui';
import { Window, Tab } from '@/core';

export class FailLoad extends UIPageView {
  constructor(
    private readonly tab: Tab,
    private readonly _code: number,
    private readonly _description: string,
    private readonly _url: string,
  ) {
    super(`tab-${tab.id}#fail-load`, {
      query: {
        tabId: tab.id.toString(),
        url: _url,
        code: _code.toString(),
        description: _description,
      },
      page: 'tab-fail-load',
    });
  }

  get code(): number {
    return this._code;
  }

  get description(): string {
    return this._description;
  }

  get url(): string {
    return this._url;
  }

  checkVisibility(window: Window) {
    const selectedTab = window.selectedTab;
    this.setVisible(selectedTab?.tab.id === this.tab.id);
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
