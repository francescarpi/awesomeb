import Store from 'electron-store';
import { userDataPath } from '@/paths';
import {
  VisitHistoryStoreScheme,
  type IVisitHistory,
  type IHistoryItem,
  type IVisitItem,
} from './schemes';
import {
  type AddUrlDetails,
  type SearchQuery,
  type GetVisitsDetails,
  type DeleteUrlDetails,
  type DeleteRange,
  type TFindUrlResult,
} from './types';
import { bestMatchWithRange } from './helpers';
import { randomUUID } from 'crypto';
import { validateStore } from '@/core/validation';

export class VisitHistory {
  private readonly _store: Store<IVisitHistory>;

  constructor() {
    const defaults: IVisitHistory = { history: [] };

    // Validate defaults before passing to electron-store
    VisitHistoryStoreScheme.parse(defaults);

    this._store = new Store<IVisitHistory>({
      name: 'visit-history',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk, fall back to defaults if corrupted
    this._store.store = validateStore(
      VisitHistoryStoreScheme,
      this._store.store,
      'VisitHistory',
      defaults,
    );
  }

  get all(): IHistoryItem[] {
    const data = this._store.get('history') || [];
    // Validate the full store on read
    VisitHistoryStoreScheme.parse(this._store.store);
    return data;
  }

  addUrl(details: AddUrlDetails): void {
    const history = this.all;
    const now = Date.now();

    const visit: IVisitItem = {
      visitId: randomUUID(),
      url: details.url,
      title: details.title,
      visitTime: now,
      referringVisitId: details.referringVisitId ?? '',
      transition: details.transition ?? 'link',
      isLocal: details.isLocal ?? false,
    };

    const existingIndex = history.findIndex((item) => item.url === details.url);

    let updatedHistory: IHistoryItem[];

    if (existingIndex >= 0) {
      const existing = history[existingIndex];
      const updatedItem: IHistoryItem = {
        ...existing,
        title: details.title ?? existing.title,
        lastVisitTime: now,
        visitCount: existing.visitCount + 1,
        visits: [...existing.visits, visit],
      };
      updatedHistory = [...history];
      updatedHistory[existingIndex] = updatedItem;
    } else {
      const newItem: IHistoryItem = {
        id: details.url,
        url: details.url,
        title: details.title,
        lastVisitTime: now,
        visitCount: 1,
        visits: [visit],
      };
      updatedHistory = [...history, newItem];
    }

    // Validate before persisting
    VisitHistoryStoreScheme.parse({ history: updatedHistory });
    this._store.set('history', updatedHistory);
  }

  cleanupOldEntries(retentionDays: number): void {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const history = this.all;
    const updatedHistory = history.filter((item) => item.lastVisitTime >= cutoff);

    if (updatedHistory.length !== history.length) {
      VisitHistoryStoreScheme.parse({ history: updatedHistory });
      this._store.set('history', updatedHistory);
    }
  }

  queryHistory(query: SearchQuery): IHistoryItem[] {
    const history = this.all;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const startTime = query.startTime ?? now - oneDayMs;
    const endTime = query.endTime ?? now;
    const maxResults = query.maxResults ?? 100;
    const text = query.text?.toLowerCase();

    let results = history.filter((item) => {
      const inTimeRange = item.lastVisitTime >= startTime && item.lastVisitTime <= endTime;
      if (!inTimeRange) return false;

      if (text) {
        const urlMatch = item.url.toLowerCase().includes(text);
        const titleMatch = item.title?.toLowerCase().includes(text) ?? false;
        return urlMatch || titleMatch;
      }

      return true;
    });

    results = results.sort((a, b) => b.lastVisitTime - a.lastVisitTime).slice(0, maxResults);

    return results;
  }

  getVisits(details: GetVisitsDetails): IVisitItem[] {
    const history = this.all;
    const item = history.find((h) => h.url === details.url);
    if (!item) return [];
    return [...item.visits].sort((a, b) => b.visitTime - a.visitTime);
  }

  deleteUrl(details: DeleteUrlDetails): void {
    const history = this.all;
    const updatedHistory = history.filter((item) => item.url !== details.url);

    // Validate before persisting
    VisitHistoryStoreScheme.parse({ history: updatedHistory });
    this._store.set('history', updatedHistory);
  }

  deleteUrls(urls: string[]): void {
    const urlSet = new Set(urls);
    const history = this.all;
    const updatedHistory = history.filter((item) => !urlSet.has(item.url));

    // Validate before persisting
    VisitHistoryStoreScheme.parse({ history: updatedHistory });
    this._store.set('history', updatedHistory);
  }

  deleteRange(range: DeleteRange): void {
    const history = this.all;

    const updatedHistory = history
      .map((item) => {
        const filteredVisits = item.visits.filter(
          (visit) => visit.visitTime < range.startTime || visit.visitTime > range.endTime,
        );

        if (filteredVisits.length === 0) {
          return null;
        }

        const lastVisit = filteredVisits.reduce((latest, visit) =>
          visit.visitTime > latest.visitTime ? visit : latest,
        );

        return {
          ...item,
          lastVisitTime: lastVisit.visitTime,
          visitCount: filteredVisits.length,
          visits: filteredVisits,
        };
      })
      .filter((item): item is IHistoryItem => item !== null);

    // Validate before persisting
    VisitHistoryStoreScheme.parse({ history: updatedHistory });
    this._store.set('history', updatedHistory);
  }

  deleteAll(): void {
    const empty: IHistoryItem[] = [];
    VisitHistoryStoreScheme.parse({ history: empty });
    this._store.set('history', empty);
  }

  getAll(): IHistoryItem[] {
    return [...this.all].sort((a, b) => b.lastVisitTime - a.lastVisitTime);
  }

  autocompleteUrls(query: string, limit: number = 10): TFindUrlResult[] {
    if (!query || query.trim() === '') {
      return [];
    }

    const history = this.getAll();
    const uniqueUrls = history.map((item) => item.url);

    return bestMatchWithRange(uniqueUrls, query, limit);
  }
}
