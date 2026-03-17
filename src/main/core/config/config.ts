import Store from 'electron-store';
import { userDataPath } from '@/paths';
import path from 'path';
import os from 'os';
import { EPermissionConfigType, IConfig, IConfigSearchEngine } from '~/types';

export class Config extends Store<IConfig> {
  constructor() {
    super({
      name: 'config',
      cwd: userDataPath(),
      defaults: {
        searchEngines: [
          {
            code: 'google',
            label: 'Google',
            url: 'https://www.google.com/search?q={query}',
          },
          {
            code: 'bing',
            label: 'Bing',
            url: 'https://www.bing.com/search?q={query}',
          },
          {
            code: 'duckduckgo',
            label: 'DuckDuckGo',
            url: 'https://duckduckgo.com/?q={query}',
          },
          {
            code: 'ecosia',
            label: 'Ecosia',
            url: 'https://www.ecosia.org/search?q={query}',
          },
          {
            code: 'perplexity',
            label: 'Perplexity',
            url: 'https://www.perplexity.ai/search/{query}',
          },
          {
            code: 'wikipedia',
            label: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/{query}',
          },
        ],
        partitions: [],
        downloadsFolder: path.join(os.homedir(), 'Downloads'),
        themes: [],
        permissionsType: EPermissionConfigType.Standard,
      },
    });
  }

  getProperty<K extends keyof IConfig>(key: K): IConfig[K] {
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
    return this.store;
  }

  save(config: IConfig) {
    this.store = { ...config };
  }
}
