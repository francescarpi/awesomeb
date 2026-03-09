import EventEmitter from 'events';
import { TFindInPageAction, TFindInPageId, IFindInPageSearch } from '~/types';
import type { Result } from 'electron';
import { MARGIN, UIPageView } from '@/ui';
import { Window, Tab } from '@/core';
import { FIND_IN_PAGE_VIEW_HEIGHT } from './constants';

export class FindInPage extends UIPageView {
  private readonly _searches: Map<TFindInPageId, IFindInPageSearch> = new Map();

  constructor(
    public readonly eventsChannel: EventEmitter,
    private readonly tab: Tab,
  ) {
    super(`tab-${tab.id}#find-in-page`, 'browser', {
      visible: false,
      query: {
        tabId: tab.id.toString(),
      },
      page: 'find-in-page',
    });
  }

  addSearch(requestId: TFindInPageId, query: string, action: TFindInPageAction) {
    this._searches.set(requestId, { requestId, query, action, result: null });
  }

  setResult(requestId: TFindInPageId, result: Result) {
    const search = this._searches.get(requestId);
    if (search) {
      search.result = result;
      this._searches.set(requestId, search);
      this.eventsChannel.emit('tab:find-in-page-result-did-change', this.tab.id, requestId);
    }
  }

  get searches(): Map<TFindInPageId, IFindInPageSearch> {
    return this._searches;
  }

  getSearch(requestId: TFindInPageId): IFindInPageSearch | null {
    return this._searches.get(requestId) || null;
  }

  render(window: Window) {
    this.webContentsView.setBounds({
      x: this.tab.view.left,
      y: window.bounds.height - FIND_IN_PAGE_VIEW_HEIGHT - MARGIN,
      width: this.tab.view.width,
      height: FIND_IN_PAGE_VIEW_HEIGHT,
    });
  }
}
