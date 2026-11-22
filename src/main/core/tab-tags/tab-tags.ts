import Store from 'electron-store';
import { userDataPath } from '@/paths';
import { TabTagsStoreScheme, type ITabTagsStore } from './schemes';
import type { TTabId, TTabTagId } from '~/types';
import { validateStore } from '@/core/validation';

export class TabTags {
  private readonly _store: Store<ITabTagsStore>;

  constructor() {
    const defaults: ITabTagsStore = { tabTags: {} };

    // Validate defaults before passing to electron-store
    TabTagsStoreScheme.parse(defaults);

    this._store = new Store<ITabTagsStore>({
      name: 'tab-tags',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk, fall back to defaults if corrupted
    this._store.store = validateStore(TabTagsStoreScheme, this._store.store, 'TabTags', defaults);
  }

  assign(tabId: TTabId, tagId: TTabTagId): void {
    const tabTags = { ...this._store.get('tabTags') };
    const tags = tabTags[tabId.toString()] || [];

    if (tags.includes(tagId)) {
      return;
    }

    tabTags[tabId.toString()] = [...tags, tagId];

    this._set(tabTags);
  }

  unassign(tabId: TTabId, tagId: TTabTagId): void {
    const tabTags = { ...this._store.get('tabTags') };
    const key = tabId.toString();
    const tags = tabTags[key];

    if (!tags) {
      return;
    }

    const remaining = tags.filter((t) => t !== tagId);

    if (remaining.length === 0) {
      delete tabTags[key];
    } else {
      tabTags[key] = remaining;
    }

    this._set(tabTags);
  }

  get(tabId: TTabId): TTabTagId[] {
    return this._store.get('tabTags')[tabId.toString()] || [];
  }

  removeTab(tabId: TTabId): void {
    const tabTags = { ...this._store.get('tabTags') };
    const key = tabId.toString();

    if (!(key in tabTags)) {
      return;
    }

    delete tabTags[key];

    this._set(tabTags);
  }

  removeTag(tagId: TTabTagId): void {
    const tabTags = { ...this._store.get('tabTags') };
    let changed = false;

    for (const [key, tags] of Object.entries(tabTags)) {
      const remaining = tags.filter((t) => t !== tagId);

      if (remaining.length === tags.length) {
        continue;
      }

      changed = true;

      if (remaining.length === 0) {
        delete tabTags[key];
      } else {
        tabTags[key] = remaining;
      }
    }

    if (!changed) {
      return;
    }

    this._set(tabTags);
  }

  private _set(tabTags: Record<string, TTabTagId[]>): void {
    const store: ITabTagsStore = { tabTags };

    TabTagsStoreScheme.parse(store);

    this._store.set('tabTags', tabTags);
  }
}
