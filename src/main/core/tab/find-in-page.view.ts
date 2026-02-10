import { UIPageView, UIView } from '@/ui';
import { TTabId } from '~/types';
import { Window } from '@/core';
import log from 'electron-log';
import { FIND_IN_PAGE_VIEW_HEIGHT } from './constants';

const scopeLog = log.scope('FindInPageView');

export class FindInPageView extends UIPageView {
  constructor(private readonly tabId: TTabId) {
    super(`find-in-page-${tabId}`, {
      visible: false,
      query: {
        tabId: tabId.toString(),
      },
      page: 'find-in-page',
    });
  }

  refreshBounds(window: Window) {
    const tab = window.getView<UIView>(`tab-${this.tabId}`);
    if (!tab) {
      scopeLog.error(`Tab view not found for tabId: ${this.tabId}`);
      return;
    }

    this.webContentsView.setBounds({
      x: tab.left,
      y: tab.top + tab.height - FIND_IN_PAGE_VIEW_HEIGHT,
      width: tab.width,
      height: FIND_IN_PAGE_VIEW_HEIGHT,
    });
  }
}
