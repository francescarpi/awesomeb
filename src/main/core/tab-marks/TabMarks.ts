import Store from 'electron-store';
import { userDataPath } from '@/paths';
import { MarksStoreScheme, type ITabMark, type IMarksStore } from './schemes';
import type { TTabId } from '~/types';

export class TabMarks {
  private readonly _store: Store<IMarksStore>;

  constructor() {
    const defaults: IMarksStore = { marks: [] };

    // Validate defaults before passing to electron-store
    MarksStoreScheme.parse(defaults);

    this._store = new Store<IMarksStore>({
      name: 'marks',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk
    MarksStoreScheme.parse(this._store.store);
  }

  add(trigger: string, tabId: TTabId, title: string) {
    const marks = this._store.get('marks').filter((m) => m.trigger !== trigger);
    marks.push({ trigger, tabId, title });
    MarksStoreScheme.parse({ marks });
    this._store.set('marks', marks);
  }

  delete(trigger: string) {
    const marks = this._store.get('marks').filter((m) => m.trigger !== trigger);
    MarksStoreScheme.parse({ marks });
    this._store.set('marks', marks);
  }

  deleteByTabId(tabId: TTabId) {
    const marks = this._store.get('marks').filter((m) => m.tabId !== tabId);
    MarksStoreScheme.parse({ marks });
    this._store.set('marks', marks);
  }

  deleteAll() {
    MarksStoreScheme.parse({ marks: [] });
    this._store.set('marks', []);
  }

  get(trigger: string): ITabMark | null {
    // Validate the full store on read
    MarksStoreScheme.parse(this._store.store);
    const mark = this._store.get('marks').find((m) => m.trigger === trigger);
    return mark || null;
  }

  get all(): ITabMark[] {
    // Validate the full store on read
    MarksStoreScheme.parse(this._store.store);
    return this._store.get('marks');
  }
}
