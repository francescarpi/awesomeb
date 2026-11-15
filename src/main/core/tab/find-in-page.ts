import EventEmitter from 'events';
import { TFindInPageAction, TFindInPageId, IFindInPageSearch } from '~/types';
import type { Result } from 'electron';
import { UIPageView, type IViewBoundsOptions } from '@/ui';
import { Window, Tab } from '@/core';
import { FIND_IN_PAGE_VIEW_HEIGHT } from './constants';
import { LAYOUT_MARGIN } from '~/constants';

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

  refreshBounds(_window: Window, options?: IViewBoundsOptions) {
    // Use the tab's TARGET bounds: while the tab is animating, its live bounds
    // are the intermediate ones, and this bar has to end up exactly as wide as
    // the tab (it sits right below it).
    const tabBounds = this.tab.targetBounds;

    this.setBounds(
      {
        x: tabBounds.x,
        y: tabBounds.y + tabBounds.height + LAYOUT_MARGIN,
        width: tabBounds.width,
        height: FIND_IN_PAGE_VIEW_HEIGHT,
      },
      options,
    );
  }
}
