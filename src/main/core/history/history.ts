import Store from 'electron-store';
import { SessionHistoryScheme, type ISessionHistory, type ISessionHistoryTab } from './schemes';
import { userDataPath } from '@/paths';
import { Tab } from '@/core';
import { TTabId } from '~/types';
import { validateStore } from '@/core/validation';
import { sanitizeHistory } from './helpers';

export class History {
  private readonly _store: Store<ISessionHistory>;

  constructor() {
    const defaults: ISessionHistory = {
      tabs: {},
    };

    // Validate defaults before passing to electron-store
    SessionHistoryScheme.parse(defaults);

    this._store = new Store<ISessionHistory>({
      name: 'history',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk, fall back to defaults if corrupted
    this._store.store = validateStore(SessionHistoryScheme, this._store.store, 'History', defaults);
  }

  save(tab: Tab) {
    if (tab.partition.private || tab.webContents === undefined) {
      return;
    }

    const history = this.get(tab.id) || { index: 0, entries: [] };
    const { index, entries } = sanitizeHistory(tab.webContents);

    history.entries = entries;
    history.index = index;

    const tabs = this._store.get('tabs');
    tabs[tab.id] = history;

    // Validate before persisting
    SessionHistoryScheme.parse({ tabs });

    this._store.set('tabs', tabs);
  }

  get(tabId: TTabId): ISessionHistoryTab | null {
    // Validate the full store on read
    SessionHistoryScheme.parse(this._store.store);
    return this._store.get(`tabs.${tabId}`) || null;
  }

  clear() {
    // Validate before persisting
    SessionHistoryScheme.parse({ tabs: {} });
    this._store.set('tabs', {});
  }

  delete(tabId: TTabId) {
    const tabs = this._store.get('tabs');
    if (tabs[tabId]) {
      delete tabs[tabId];

      // Validate before persisting
      SessionHistoryScheme.parse({ tabs });

      this._store.set('tabs', tabs);
    }
  }
}
