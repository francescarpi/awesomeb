import EventEmitter from 'events';
import { TFindInPageAction, TFindInPageId, IFindInPageSearch, TTabId } from '~/types';
import type { Result } from 'electron';
import { MARGIN, UIPageView, UIView } from '@/ui';
import { Window } from '@/core';
import log from 'electron-log';
import { FIND_IN_PAGE_VIEW_HEIGHT } from './constants';

const scopeLog = log.scope('FindInPage');

export class FindInPage extends UIPageView {
  private readonly _searches: Map<TFindInPageId, IFindInPageSearch> = new Map();

  constructor(
    public readonly eventsChannel: EventEmitter,
    private readonly tabId: TTabId,
  ) {
    super(`find-in-page-${tabId}`, 'browser', {
      visible: false,
      query: {
        tabId: tabId.toString(),
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
      this.eventsChannel.emit('tab:find-in-page-result-did-change', this.tabId, requestId);
    }
  }

  get searches(): Map<TFindInPageId, IFindInPageSearch> {
    return this._searches;
  }

  getSearch(requestId: TFindInPageId): IFindInPageSearch | null {
    return this._searches.get(requestId) || null;
  }

  refreshBounds(window: Window) {
    const tab = window.getView<UIView>(`tab-${this.tabId}`);
    if (!tab) {
      scopeLog.error(`Tab view not found for tabId: ${this.tabId}`);
      return;
    }

    this.webContentsView.setBounds({
      x: tab.left,
      y: window.bounds.height - FIND_IN_PAGE_VIEW_HEIGHT - MARGIN,
      width: tab.width,
      height: FIND_IN_PAGE_VIEW_HEIGHT,
    });
  }
}
