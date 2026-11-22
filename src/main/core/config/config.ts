import Store from 'electron-store';
import { userDataPath } from '@/paths';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import slugify from 'slugify';
import { EPermissionConfigType, type TTabTagId } from '~/types';
import {
  ConfigScheme,
  type IConfig,
  type IConfigSearchEngine,
  type IConfigTag,
} from './schemes';
import { DEFAULT_UI_THEME, DEFAULT_SHORTCUTS_MAP } from '~/constants';
import { validateStore } from '@/core/validation';
import { contrastingTextColor } from '@/utils';
import { tabTags } from '@/core/tab-tags';

export class Config extends Store<IConfig> {
  private _validatedStore: IConfig | null = null;

  constructor() {
    const defaults: IConfig = {
      searchEngines: [],
      partitions: [],
      downloadsFolder: path.join(os.homedir(), 'Downloads'),
      themes: [],
      tags: [],
      permissionsType: EPermissionConfigType.Standard,
      shortcutMap: DEFAULT_SHORTCUTS_MAP,
      shortcutsOverrides: {},
      historyRetentionDays: 7,
      closedTabsRetentionDays: 7,
      closedTabsMaxLength: 30,
      uiTheme: DEFAULT_UI_THEME,
      // locale is set on first run via initI18n() based on the OS locale
      locale: undefined,
    };

    // Validate defaults before passing to electron-store
    ConfigScheme.parse(defaults);

    super({
      name: 'config',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk, fall back to defaults if corrupted
    this.store = validateStore(ConfigScheme, this.store, 'Config', defaults);

    // Invalidate the in-memory cache on ANY store write (save(), config.set(),
    // delete(), clear(), this.store = ...): conf dispatches a raw 'change'
    // event on every write (conf@15 dist/source/index.js:266). The raw
    // EventTarget listener avoids the disk re-read that onDidAnyChange() does.
    this.events.addEventListener('change', () => {
      this._validatedStore = null;
    });
  }

  private get validatedStore(): IConfig {
    if (this._validatedStore === null) {
      this._validatedStore = ConfigScheme.parse(this.store);
    }
    return this._validatedStore;
  }

  getProperty<K extends keyof IConfig>(key: K): IConfig[K] {
    return this.validatedStore[key];
  }

  get defaultSearchEngine(): IConfigSearchEngine {
    const searchEngines = this.getProperty('searchEngines');
    return searchEngines[0];
  }

  get isStandardPermissions() {
    return this.getProperty('permissionsType') === EPermissionConfigType.Standard;
  }

  get config(): IConfig {
    // Fresh shallow copy — top-level mutation hits the copy, not the cache or
    // the underlying store. NESTED mutation (arrays/objects like
    // shortcutsOverrides, searchEngines) still mutates the cache and the
    // underlying store — callers that need to mutate nested fields must call
    // save() afterwards to fire the 'change' event and invalidate the cache.
    return { ...this.validatedStore };
  }

  save(config: IConfig) {
    // Validate before persisting
    ConfigScheme.parse(config);
    this.store = { ...config };
  }

  get wasConfigured(): boolean {
    return this.getProperty('searchEngines').length > 0;
  }

  createTag(name: string, color: string): IConfigTag {
    const slug = slugify(name, { lower: true, strict: true }).slice(0, 10);

    if (slug.length < 3) {
      throw new Error('Tag name must be at least 3 characters long');
    }

    const tags = this.getProperty('tags');
    const existing = tags.find((tag) => tag.name === slug);

    if (existing) {
      return existing;
    }

    const tag: IConfigTag = {
      id: randomUUID(),
      color,
      textColor: contrastingTextColor(color),
      name: slug,
    };

    this.save({ ...this.config, tags: [...tags, tag] });

    return tag;
  }

  removeTag(tagId: TTabTagId): void {
    const tags = this.getProperty('tags');
    const remaining = tags.filter((tag) => tag.id !== tagId);

    if (remaining.length === tags.length) {
      return;
    }

    this.save({ ...this.config, tags: remaining });

    tabTags.removeTag(tagId);
  }

  saveTags(tags: { name: string; color: string }[]): void {
    const current = this.getProperty('tags');
    const result: IConfigTag[] = [];

    for (const tag of tags) {
      const slug = slugify(tag.name, { lower: true, strict: true }).slice(0, 10);

      if (slug.length < 3) {
        throw new Error('Tag name must be at least 3 characters long');
      }

      if (result.some((t) => t.name === slug)) {
        throw new Error(`A tag named "${slug}" already exists`);
      }

      const existing = current.find((t) => t.name === slug);

      result.push(
        existing
          ? { ...existing, color: tag.color, textColor: contrastingTextColor(tag.color) }
          : {
              id: randomUUID(),
              color: tag.color,
              textColor: contrastingTextColor(tag.color),
              name: slug,
            },
      );
    }

    for (const removed of current.filter((t) => !result.some((r) => r.id === t.id))) {
      tabTags.removeTag(removed.id);
    }

    this.save({ ...this.config, tags: result });
  }
}
