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
    super(`tab-${tab.id}#find-in-page`, {
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

  checkVisibility(window: Window) {
    const selectedTab = window.selectedTab;
    const visibleTabs: number[] = [];

    if (selectedTab) {
      const tabContainer = selectedTab.tabContainer;
      for (const tab of tabContainer.tabs) {
        visibleTabs.push(tab.id);
        if (tab.tabPreview) {
          visibleTabs.push(tab.tabPreview.tab.id);
        }
      }
    }

    this.setVisible(visibleTabs.includes(this.tab.id));
  }

  refreshBounds(_window: Window) {
    this.webContentsView.setBounds({
      x: this.tab.left,
      y: this.tab.top + this.tab.height + MARGIN,
      width: this.tab.width,
      height: FIND_IN_PAGE_VIEW_HEIGHT,
    });
  }
}
