import { expect, test, describe } from 'vitest';
import {
  ConfigScheme,
  ConfigSearchEngineScheme,
  ConfigPartitionScheme,
  ConfigThemeScheme,
  ConfigTagScheme,
} from './schemes';
import { ZodError } from 'zod';

const validConfig = {
  searchEngines: [{ code: 'google', label: 'Google', url: 'https://google.com' }],
  partitions: [{ name: 'personal', color: '#ff0000' }],
  downloadsFolder: '/home/user/Downloads',
  themes: [{ name: 'dark', primary: '#000000', secondary: '#ffffff', degrees: 45 }],
  tags: [{ id: 'tag-1', color: '#ff0000', textColor: '#000000', name: 'work' }],
  permissionsType: 'standard' as const,
  shortcutMap: 'generic-iso',
  shortcutsOverrides: { 'tab-next': 'Ctrl+Tab' },
  historyRetentionDays: 7,
  closedTabsRetentionDays: 7,
  closedTabsMaxLength: 30,
  uiTheme: 'cupcake',
};

describe('ConfigScheme', () => {
  test('valid config parses successfully', () => {
    const result = ConfigScheme.parse(validConfig);
    expect(result).toEqual(validConfig);
  });

  test('missing required field throws ZodError', () => {
    const invalid = { ...validConfig };
    delete (invalid as Record<string, unknown>).downloadsFolder;

    expect(() => ConfigScheme.parse(invalid)).toThrow(ZodError);
  });

  test('invalid permissionsType throws ZodError', () => {
    const invalid = { ...validConfig, permissionsType: 'invalid' };

    expect(() => ConfigScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws ZodError due to strict mode', () => {
    const invalid = { ...validConfig, extraProperty: 'not-allowed' };

    expect(() => ConfigScheme.parse(invalid)).toThrow(ZodError);
  });

  test('empty searchEngines array is valid', () => {
    const config = { ...validConfig, searchEngines: [] };
    const result = ConfigScheme.parse(config);
    expect(result.searchEngines).toEqual([]);
  });

  test('empty partitions array is valid', () => {
    const config = { ...validConfig, partitions: [] };
    const result = ConfigScheme.parse(config);
    expect(result.partitions).toEqual([]);
  });

  test('empty themes array is valid', () => {
    const config = { ...validConfig, themes: [] };
    const result = ConfigScheme.parse(config);
    expect(result.themes).toEqual([]);
  });

  test('missing tags is valid and defaults to an empty array', () => {
    const config = { ...validConfig };
    delete (config as Record<string, unknown>).tags;

    const result = ConfigScheme.parse(config);
    expect(result.tags).toEqual([]);
  });

  test('valid tags are parsed and kept', () => {
    const config = {
      ...validConfig,
      tags: [
        { id: 'tag-1', color: '#ff0000', textColor: '#000000', name: 'work' },
        { id: 'tag-2', color: '#00ff00', textColor: '#000000', name: 'personal' },
      ],
    };

    const result = ConfigScheme.parse(config);
    expect(result.tags).toEqual(config.tags);
  });

  test('invalid tag throws ZodError', () => {
    const invalid = {
      ...validConfig,
      tags: [{ id: 'tag-1', color: 123, textColor: '#000', name: 'bad' }],
    };

    expect(() => ConfigScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property in tag throws ZodError', () => {
    const invalid = {
      ...validConfig,
      tags: [{ id: 'tag-1', color: '#ff0000', textColor: '#000', name: 'work', extra: true }],
    };

    expect(() => ConfigScheme.parse(invalid)).toThrow(ZodError);
  });

  test('invalid type in searchEngine throws ZodError', () => {
    const invalid = {
      ...validConfig,
      searchEngines: [{ code: 123, label: 'Bad', url: 'https://bad.com' }],
    };

    expect(() => ConfigScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property in searchEngine throws ZodError', () => {
    const invalid = {
      ...validConfig,
      searchEngines: [{ code: 'google', label: 'Google', url: 'https://google.com', extra: true }],
    };

    expect(() => ConfigScheme.parse(invalid)).toThrow(ZodError);
  });

  test('invalid degrees type throws ZodError', () => {
    const invalid = {
      ...validConfig,
      themes: [{ name: 'bad', primary: '#000', secondary: '#fff', degrees: '45' }],
    };

    expect(() => ConfigScheme.parse(invalid)).toThrow(ZodError);
  });

  test('shortcutsOverrides with non-string value throws ZodError', () => {
    const invalid = {
      ...validConfig,
      shortcutsOverrides: { 'tab-next': 123 },
    };

    expect(() => ConfigScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('ConfigSearchEngineScheme', () => {
  test('valid search engine parses successfully', () => {
    const engine = { code: 'duckduckgo', label: 'DuckDuckGo', url: 'https://ddg.com' };
    const result = ConfigSearchEngineScheme.parse(engine);
    expect(result).toEqual(engine);
  });

  test('missing code throws ZodError', () => {
    const invalid = { label: 'No Code', url: 'https://example.com' };
    expect(() => ConfigSearchEngineScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('ConfigPartitionScheme', () => {
  test('valid partition parses successfully', () => {
    const partition = { name: 'work', color: '#00ff00' };
    const result = ConfigPartitionScheme.parse(partition);
    expect(result).toEqual(partition);
  });

  test('missing color throws ZodError', () => {
    const invalid = { name: 'No Color' };
    expect(() => ConfigPartitionScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('ConfigThemeScheme', () => {
  test('valid theme parses successfully', () => {
    const theme = { name: 'light', primary: '#fff', secondary: '#000', degrees: 90 };
    const result = ConfigThemeScheme.parse(theme);
    expect(result).toEqual(theme);
  });

  test('missing degrees throws ZodError', () => {
    const invalid = { name: 'No Degrees', primary: '#fff', secondary: '#000' };
    expect(() => ConfigThemeScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('ConfigTagScheme', () => {
  test('valid tag parses successfully', () => {
    const tag = { id: 'tag-1', color: '#ff0000', textColor: '#000000', name: 'work' };
    const result = ConfigTagScheme.parse(tag);
    expect(result).toEqual(tag);
  });

  test('missing id throws ZodError', () => {
    const invalid = { color: '#ff0000', textColor: '#000000', name: 'work' };
    expect(() => ConfigTagScheme.parse(invalid)).toThrow(ZodError);
  });

  test('missing color throws ZodError', () => {
    const invalid = { id: 'tag-1', textColor: '#000000', name: 'No Color' };
    expect(() => ConfigTagScheme.parse(invalid)).toThrow(ZodError);
  });

  test('missing name throws ZodError', () => {
    const invalid = { id: 'tag-1', color: '#ff0000', textColor: '#000000' };
    expect(() => ConfigTagScheme.parse(invalid)).toThrow(ZodError);
  });

  test('missing textColor throws ZodError', () => {
    const invalid = { id: 'tag-1', color: '#ff0000', name: 'work' };
    expect(() => ConfigTagScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws ZodError', () => {
    const invalid = {
      id: 'tag-1',
      color: '#ff0000',
      textColor: '#000000',
      name: 'work',
      extra: true,
    };
    expect(() => ConfigTagScheme.parse(invalid)).toThrow(ZodError);
  });
});
