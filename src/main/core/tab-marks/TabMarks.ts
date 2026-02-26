import Store from 'electron-store';
import { userDataPath } from '@/paths';
import type { IMarksStore } from './types';
import type { ITabMark, TTabId } from '~/types';

export class TabMarks {
  private readonly _store: Store<IMarksStore>;

  constructor() {
    this._store = new Store<IMarksStore>({
      name: 'marks',
      cwd: userDataPath(),
      defaults: {
        marks: [],
      },
    });
  }

  add(trigger: string, tabId: TTabId, title: string) {
    const marks = this._store.get('marks').filter((m) => m.trigger !== trigger);
    marks.push({ trigger, tabId, title });
    this._store.set('marks', marks);
  }

  delete(trigger: string) {
    const marks = this._store.get('marks').filter((m) => m.trigger !== trigger);
    this._store.set('marks', marks);
  }

  deleteByTabId(tabId: TTabId) {
    const marks = this._store.get('marks').filter((m) => m.tabId !== tabId);
    this._store.set('marks', marks);
  }

  deleteAll() {
    this._store.set('marks', []);
  }

  get(trigger: string): ITabMark | null {
    const mark = this._store.get('marks').find((m) => m.trigger === trigger);
    return mark || null;
  }

  get all(): ITabMark[] {
    return this._store.get('marks');
  }
}
