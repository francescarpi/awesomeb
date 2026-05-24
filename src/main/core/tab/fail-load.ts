import { UIPageView } from '@/ui';
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

  refreshBounds(_window: Window) {
    this.webContentsView.setBounds({
      x: this.tab.left,
      y: this.tab.top,
      width: this.tab.width,
      height: this.tab.height,
    });
  }
}
