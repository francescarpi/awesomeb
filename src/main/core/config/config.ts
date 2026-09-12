import Store from 'electron-store';
import { userDataPath } from '@/paths';
import path from 'path';
import os from 'os';
import { EPermissionConfigType } from '~/types';
import { ConfigScheme, type IConfig, type IConfigSearchEngine } from './schemes';
import { DEFAULT_UI_THEME, DEFAULT_SHORTCUTS_MAP } from '~/constants';
import { validateStore } from '@/core/validation';

export class Config extends Store<IConfig> {
  private _validatedStore: IConfig | null = null;

  constructor() {
    const defaults: IConfig = {
      searchEngines: [],
      partitions: [],
      downloadsFolder: path.join(os.homedir(), 'Downloads'),
      themes: [],
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
    // Fresh shallow copy — mutating consumers (e.g. shortcuts/ipc.ts) hit the
    // copy, not the cache or the underlying store.
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
}
