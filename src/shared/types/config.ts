export { EPermissionConfigType } from './permissions';
export type { TShortcutMapId, TShortcutId } from './shortcuts';
export type {
  IConfig,
  IConfigPartition,
  IConfigSearchEngine,
  IConfigTheme,
  TSearchEngineCode,
} from '@/core/config/schemes';

export interface IConfigInfo {
  version: string;
  configPath: string;
}
