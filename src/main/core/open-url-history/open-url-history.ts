import Store from 'electron-store';
import { IOpenUrlHistory, TFindUrlResult } from './types';
import { userDataPath } from '@/paths';
import { TOTAL_URLS_TO_KEEP } from './constants';
import { bestMatchWithRange } from './helpers';

export class OpenURLHistory {
  private readonly _store: Store<IOpenUrlHistory>;

  constructor() {
    this._store = new Store<IOpenUrlHistory>({
      name: 'open-url-history',
      cwd: userDataPath(),
      defaults: {
        urls: [],
      },
    });
  }

  add(url: string) {
    if (!url || !url.match(/^https?:\/\//i)) {
      return;
    }
    const urls = this._store.get('urls');
    const newUrls = [url, ...urls.filter((u) => u !== url)].slice(0, TOTAL_URLS_TO_KEEP);
    this._store.set('urls', newUrls);
  }

  find(query: string): TFindUrlResult[] {
    if (query.trim() === '') {
      return [];
    }

    const urls = this._store.get('urls');
    return bestMatchWithRange(urls, query);
  }

  clear() {
    this._store.set('urls', []);
  }
}
