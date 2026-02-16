import Store from 'electron-store';
import { IOpenUrlHistory } from './types';
import { userDataPath } from '@/paths';
import { TOTAL_URLS_TO_KEEP } from './constants';

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
    const urls = this._store.get('urls');
    const newUrls = [url, ...urls.filter((u) => u !== url)].slice(0, TOTAL_URLS_TO_KEEP);
    this._store.set('urls', newUrls);
  }

  find(query: string): string[] {
    if (query.trim() === '') {
      return [];
    }

    const urls = this._store.get('urls');
    return urls.filter((url) => url.toLowerCase().includes(query.toLowerCase()));
  }
}
