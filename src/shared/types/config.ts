import { EPermissionConfigType } from './permissions';
import type { TShortcutMapId, TShortcutId } from './shortcuts';

export type TSearchEngineCode = string;

export interface IConfig {
  searchEngines: IConfigSearchEngine[];
  partitions: IConfigPartition[];
  downloadsFolder: string;
  themes: IConfigTheme[];
  permissionsType: EPermissionConfigType;
  shortcutMap: TShortcutMapId;
  shortcutsOverrides: Record<TShortcutId, string>;
}

export interface IConfigPartition {
  name: string;
  color: string;
}

export interface IConfigSearchEngine {
  code: TSearchEngineCode;
  label: string;
  url: string;
}

export interface IConfigTheme {
  name: string;
  primary: string;
  secondary: string;
  degrees: number;
}
