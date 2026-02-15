import { UIPageView, UIView } from '@/ui';
import { TTabId } from '~/types';
import { Window } from '@/core';
import log from 'electron-log';

const scopeLog = log.scope('FailLoad');

export class FailLoad extends UIPageView {
  constructor(
    private readonly tabId: TTabId,
    private readonly _code: number,
    private readonly _description: string,
    private readonly _url: string,
  ) {
    super(`fail-load-tab-${tabId}`, 'browser', {
      query: {
        tabId: tabId.toString(),
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

  refreshBounds(window: Window) {
    const tab = window.getView<UIView>(`tab-${this.tabId}`);
    if (!tab) {
      scopeLog.error(`Tab view not found for tabId: ${this.tabId}`);
      return;
    }

    this.webContentsView.setBounds({
      x: tab.left,
      y: tab.top,
      width: tab.width,
      height: tab.height,
    });
  }
}
