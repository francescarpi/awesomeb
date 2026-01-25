import Store from 'electron-store';
import { IConfigStore } from './types';
import { userDataPath } from '@/paths';
import path from 'path';
import os from 'os';
import slugify from 'slugify';
import log from 'electron-log';
import { IConfigSearchEngine, TPartitionId } from '~/types';

const scopeLog = log.scope('Config');

export class Config extends Store<IConfigStore> {
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
      },
    });
  }

  getProperty<K extends keyof IConfigStore>(key: K): IConfigStore[K] {
    return this.get(key);
  }

  setProperty<K extends keyof IConfigStore>(key: K, value: IConfigStore[K]): void {
    scopeLog.debug(`Set config property: ${String(key)} = ${String(value)}`);
    this.set(key, value);
  }

  get defaultSearchEngine(): IConfigSearchEngine {
    const searchEngines = this.getProperty('searchEngines');
    return searchEngines[0];
  }

  moveSearchEngine(position: 'top' | 'up' | 'down', code: string) {
    const searchEngines = this.getProperty('searchEngines');
    const index = searchEngines.findIndex((se) => se.code === code);
    if (index === -1) {
      scopeLog.warn(`Search engine with code ${code} not found.`);
      return;
    }

    let newIndex = index;
    if (position === 'top') {
      newIndex = 0;
    } else if (position === 'up' && index > 0) {
      newIndex = index - 1;
    } else if (position === 'down' && index < searchEngines.length - 1) {
      newIndex = index + 1;
    }

    if (newIndex !== index) {
      const [movedEngine] = searchEngines.splice(index, 1);
      searchEngines.splice(newIndex, 0, movedEngine);
      this.setProperty('searchEngines', searchEngines);
      scopeLog.info(`Moved search engine ${code} to position ${newIndex}.`);
    }
  }

  deleteSearchEngine(code: string) {
    const searchEngines = this.getProperty('searchEngines');
    const index = searchEngines.findIndex((se) => se.code === code);
    if (index === -1) {
      scopeLog.warn(`Search engine with code ${code} not found.`);
      return;
    }

    searchEngines.splice(index, 1);
    this.setProperty('searchEngines', searchEngines);
    scopeLog.info(`Deleted search engine with code ${code}.`);
  }

  addSearchEngine(label: string, url: string) {
    const searchEngines = this.getProperty('searchEngines');
    const code = slugify(label);
    searchEngines.push({ code, label, url });
    this.setProperty('searchEngines', searchEngines);
    scopeLog.info(`Added new search engine with code ${code}.`);
  }

  updateSearchEngine(code: string, label: string, url: string) {
    const searchEngines = this.getProperty('searchEngines');
    const index = searchEngines.findIndex((se) => se.code === code);
    if (index === -1) {
      scopeLog.warn(`Search engine with code ${code} not found.`);
      return;
    }

    searchEngines[index] = { code, label, url };
    this.setProperty('searchEngines', searchEngines);
    scopeLog.info(`Updated search engine with code ${code}.`);
  }

  addPartition(partitionName: string, color: string) {
    const partitions = this.getProperty('partitions');

    const normalizeName = partitionName.toLowerCase().replace(/\s+/g, '-');
    const id = `persist:${normalizeName}`;

    partitions.push({ name: partitionName, color, id });
    this.setProperty('partitions', partitions);
    scopeLog.info(`Added new partition: ${partitionName}.`);
  }

  updatePartitionColor(partitionId: TPartitionId, color: string) {
    const partitions = this.getProperty('partitions');
    const index = partitions.findIndex((p) => p.id === partitionId);
    if (index === -1) {
      scopeLog.warn(`Partition with name ${partitionId} not found.`);
      return;
    }

    partitions[index].color = color;
    this.setProperty('partitions', partitions);
    scopeLog.info(`Updated color of partition ${partitionId} to ${color}.`);
  }

  deletePartition(partitionId: TPartitionId) {
    const partitions = this.getProperty('partitions');
    const index = partitions.findIndex((p) => p.id === partitionId);
    if (index === -1) {
      scopeLog.warn(`Partition with name ${partitionId} not found.`);
      return;
    }

    partitions.splice(index, 1);
    this.setProperty('partitions', partitions);
    scopeLog.info(`Deleted partition: ${partitionId}.`);
  }

  addTheme(themeName: string, primary: string, secondary: string, degrees: number) {
    const themes = this.getProperty('themes');
    themes.push({ name: themeName, primary, secondary, degrees });
    this.setProperty('themes', themes);
    scopeLog.info(`Added new theme: ${themeName}.`);
  }

  updateTheme(themeName: string, primary: string, secondary: string, degrees: number) {
    const themes = this.getProperty('themes');
    const index = themes.findIndex((t) => t.name === themeName);
    if (index === -1) {
      scopeLog.warn(`Theme with name ${themeName} not found.`);
      return;
    }

    themes[index] = { name: themeName, primary, secondary, degrees };
    this.setProperty('themes', themes);
    scopeLog.info(`Updated theme: ${themeName}.`);
  }

  deleteTheme(themeName: string) {
    const themes = this.getProperty('themes');
    const index = themes.findIndex((t) => t.name === themeName);
    if (index === -1) {
      scopeLog.warn(`Theme with name ${themeName} not found.`);
      return;
    }

    themes.splice(index, 1);
    this.setProperty('themes', themes);
    scopeLog.info(`Deleted theme: ${themeName}.`);
  }
}
