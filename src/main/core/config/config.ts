import Store from 'electron-store';
import { userDataPath } from '@/paths';
import path from 'path';
import os from 'os';
import { EPermissionConfigType } from '~/types';
import { ConfigScheme, type IConfig, type IConfigSearchEngine } from './schemes';
import { DEFAULT_UI_THEME } from '~/constants';
import { validateStore } from '@/core/validation';

export class Config extends Store<IConfig> {
  constructor() {
    const defaults: IConfig = {
      searchEngines: [],
      partitions: [],
      downloadsFolder: path.join(os.homedir(), 'Downloads'),
      themes: [],
      permissionsType: EPermissionConfigType.Standard,
      shortcutMap: 'generic-iso',
      shortcutsOverrides: {},
      historyRetentionDays: 7,
      closedTabsRetentionDays: 7,
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
  }

  getProperty<K extends keyof IConfig>(key: K): IConfig[K] {
    // Validate the entire store on every read
    ConfigScheme.parse(this.store);
    return this.get(key);
  }

  get defaultSearchEngine(): IConfigSearchEngine {
    const searchEngines = this.getProperty('searchEngines');
    return searchEngines[0];
  }

  get isStandardPermissions() {
    return this.getProperty('permissionsType') === EPermissionConfigType.Standard;
  }

  get config(): IConfig {
    // Validate before returning
    ConfigScheme.parse(this.store);
    return this.store;
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
