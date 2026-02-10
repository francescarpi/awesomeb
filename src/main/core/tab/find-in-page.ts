import EventEmitter from 'events';
import { TFindInPageAction, TFindInPageId, IFindInPageSearch, TTabId } from '~/types';
import type { Result } from 'electron';
import { FindInPageView } from './find-in-page.view';

export class FindInPage {
  private readonly _searches: Map<TFindInPageId, IFindInPageSearch> = new Map();
  readonly view: FindInPageView;

  constructor(
    public readonly eventsChannel: EventEmitter,
    private readonly tabId: TTabId,
  ) {
    this.view = new FindInPageView(tabId);
  }

  addSearch(requestId: TFindInPageId, query: string, action: TFindInPageAction) {
    this._searches.set(requestId, { requestId, query, action, result: null });
  }

  setResult(requestId: TFindInPageId, result: Result) {
    const search = this._searches.get(requestId);
    if (search) {
      search.result = result;
      this._searches.set(requestId, search);
      this.eventsChannel.emit('tab:find-in-page-result-did-change', this.tabId, requestId);
    }
  }

  get searches(): Map<TFindInPageId, IFindInPageSearch> {
    return this._searches;
  }

  close() {
    this.view.close();
  }

  getSearch(requestId: TFindInPageId): IFindInPageSearch | null {
    return this._searches.get(requestId) || null;
  }
}
