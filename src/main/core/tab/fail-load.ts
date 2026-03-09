import { UIPageView } from '@/ui';
import { Window, Tab } from '@/core';

export class FailLoad extends UIPageView {
  constructor(
    private readonly tab: Tab,
    private readonly _code: number,
    private readonly _description: string,
    private readonly _url: string,
  ) {
    super(`tab-${tab.id}#fail-load`, 'browser', {
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

  render(_window: Window) {
    this.webContentsView.setBounds({
      x: this.tab.view.left,
      y: this.tab.view.top,
      width: this.tab.view.width,
      height: this.tab.view.height,
    });
  }
}
