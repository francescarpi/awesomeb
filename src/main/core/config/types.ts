import type { IConfigPartition, IConfigSearchEngine, IConfigTheme } from '~/types';

export interface IConfigStore {
  searchEngines: IConfigSearchEngine[];
  partitions: IConfigPartition[];
  downloadsFolder: string;
  themes: IConfigTheme[];
}
