import { z } from 'zod';
import { UI_THEMES, DEFAULT_UI_THEME } from '~/constants';
import { LOCALES } from '~/i18n';

export const ConfigSearchEngineScheme = z
  .object({
    code: z.string(),
    label: z.string(),
    url: z.string(),
  })
  .strict();

export const ConfigPartitionScheme = z
  .object({
    name: z.string(),
    color: z.string(),
  })
  .strict();

export const ConfigThemeScheme = z
  .object({
    name: z.string(),
    primary: z.string(),
    secondary: z.string(),
    degrees: z.number(),
  })
  .strict();

export const ConfigScheme = z
  .object({
    searchEngines: z.array(ConfigSearchEngineScheme),
    partitions: z.array(ConfigPartitionScheme),
    downloadsFolder: z.string(),
    themes: z.array(ConfigThemeScheme),
    permissionsType: z.enum(['standard', 'strict']),
    shortcutMap: z.string(),
    shortcutsOverrides: z.record(z.string(), z.string()),
    historyRetentionDays: z.number().default(7),
    closedTabsRetentionDays: z.number().default(7),
    uiTheme: z.enum(UI_THEMES).default(DEFAULT_UI_THEME),
    locale: z.enum(LOCALES).optional(),
  })
  .strict();

export type TSearchEngineCode = string;

export type IConfig = z.infer<typeof ConfigScheme>;
export type IConfigSearchEngine = z.infer<typeof ConfigSearchEngineScheme>;
export type IConfigPartition = z.infer<typeof ConfigPartitionScheme>;
export type IConfigTheme = z.infer<typeof ConfigThemeScheme>;
