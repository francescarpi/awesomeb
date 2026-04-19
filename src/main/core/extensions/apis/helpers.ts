import type { IDesConTab } from '~/types';
import { Window } from '@/core';

export function tabToChromeTab(
  window: Window,
  tabData: IDesConTab,
  idx: number,
  selected: boolean,
): chrome.tabs.Tab {
  return {
    status: tabData.tab.suspended ? 'unloaded' : tabData.tab.loading ? 'loading' : 'complete',
    index: idx,
    openerTabId: tabData.tab.parent ? tabData.tab.parent.id : undefined,
    title: tabData.tab.title,
    url: tabData.tab.url || undefined,
    highlighted: tabData.tab.requireAttention,
    windowId: window.id,
    active: selected,
    favIconUrl: tabData.tab.favicon || undefined,
    frozen: false,
    id: tabData.tab.id,
    incognito: tabData.tab.partition.private,
    selected: tabData.tab.requireAttention,
    discarded: false,
    autoDiscardable: false,
    sessionId: tabData.tab.partition.id,
    groupId: tabData.desktop.id,
    lastAccessed: tabData.tab.lastAccessed,
    pinned: false,
  };
}
