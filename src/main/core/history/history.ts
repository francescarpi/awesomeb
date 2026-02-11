import Store from 'electron-store';
import type { ISessionHistory, ISessionHistoryTab } from './types';
import { userDataPath } from '@/paths';
import { Tab } from '@/core';
import { TTabId } from '~/types';

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
    if (tab.partition.private || tab.view.webContents === undefined) {
      return;
    }

    const history = this.get(tab.id) || { index: 0, entries: [] };
    const entries = tab.view.webContents.navigationHistory.getAllEntries();
    const index = tab.view.webContents.navigationHistory.getActiveIndex();

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
}
