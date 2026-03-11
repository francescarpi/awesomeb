import Store from 'electron-store';
import type { ISessionHistory, ISessionHistoryTab } from './types';
import { userDataPath } from '@/paths';
import { Tab } from '@/core';
import { TTabId } from '~/types';
import { NavigationEntry, WebContents } from 'electron';

export class History {
  private readonly _store: Store<ISessionHistory>;

  constructor() {
    this._store = new Store<ISessionHistory>({
      name: 'history',
      cwd: userDataPath(),
      defaults: {
        tabs: {},
      },
    });
  }

  save(tab: Tab) {
    if (tab.partition.private || tab.webContents === undefined) {
      return;
    }

    const history = this.get(tab.id) || { index: 0, entries: [] };
    const { index, entries } = this.sanitizeHistory(tab.webContents);

    history.entries = entries;
    history.index = index;

    const tabs = this._store.get('tabs');
    tabs[tab.id] = history;

    this._store.set('tabs', tabs);
  }

  get(tabId: TTabId): ISessionHistoryTab | null {
    return this._store.get(`tabs.${tabId}`) || null;
  }

  clear() {
    this._store.set('tabs', {});
  }

  delete(tabId: TTabId) {
    const tabs = this._store.get('tabs');
    if (tabs[tabId]) {
      delete tabs[tabId];
      this._store.set('tabs', tabs);
    }
  }

  private sanitizeHistory(wc: WebContents, maxEntries = 50): ISessionHistoryTab {
    // Create a deep copy of the navigation entries to avoid mutating the original objects
    let entries = wc.navigationHistory.getAllEntries().map((entry) => ({ ...entry }));

    // Remove 'about:blank' entries
    entries = entries.filter((e) => e.url !== 'about:blank');

    // Remove duplicate consecutive entries
    const filtered: NavigationEntry[] = [];
    for (const e of entries) {
      if (filtered.length === 0) {
        filtered.push(e);
      } else {
        const prev = filtered[filtered.length - 1];
        if (prev.url !== e.url) filtered.push(e);
      }
    }
    entries = filtered;

    // Limit to maxEntries
    let index = wc.navigationHistory.getActiveIndex();
    if (entries.length > maxEntries) {
      const sliceStart = entries.length - maxEntries;
      entries = entries.slice(sliceStart);
      index = Math.max(0, index - sliceStart);
    }

    // Last validation of index
    if (index < 0) index = 0;
    if (index >= entries.length) index = Math.max(0, entries.length - 1);

    return { index, entries };
  }
}
