import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { Config } from './config';
import { ConfigScheme } from './schemes';
import { ZodError } from 'zod';
import { userDataPath } from '@/paths';
import { tabTags } from '@/core/tab-tags';
import fs from 'fs';
import path from 'path';

// Helper to get the config file path (must match electron-store's naming)
function getConfigFilePath() {
  return path.join(userDataPath(), 'config.json');
}

// Helper to clean up config file between tests
function cleanConfigFile() {
  const configPath = getConfigFilePath();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}

beforeEach(() => {
  cleanConfigFile();
});

afterEach(() => {
  cleanConfigFile();
});

describe('Config', () => {
  test('constructor with valid defaults succeeds', () => {
    const config = new Config();
    expect(config).toBeDefined();
    expect(config.getProperty('shortcutMap')).toBe('generic-ansi');
  });

  test('constructor with corrupted disk config falls back to defaults', () => {
    const configPath = getConfigFilePath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        searchEngines: 'not-an-array',
        partitions: [],
        downloadsFolder: '/tmp',
        themes: [],
        permissionsType: 'standard',
        shortcutMap: 'generic-ansi',
        shortcutsOverrides: {},
      }),
    );

    const config = new Config();
    expect(config).toBeDefined();
    expect(config.getProperty('shortcutMap')).toBe('generic-ansi');
  });

  test('getProperty validates on read', () => {
    const config = new Config();

    // getProperty should work normally with valid data
    const searchEngines = config.getProperty('searchEngines');
    expect(searchEngines.length).toBe(0);
  });

  test('config getter validates on read', () => {
    const config = new Config();
    const fullConfig = config.config;
    expect(fullConfig.shortcutMap).toBe('generic-ansi');
  });

  test('save rejects invalid config', () => {
    const config = new Config();

    const invalidConfig = {
      ...config.config,
      permissionsType: 'invalid-permission',
    };

    expect(() => config.save(invalidConfig as unknown as typeof config.config)).toThrow(ZodError);

    // Verify original config is unchanged
    expect(config.getProperty('permissionsType')).toBe('standard');
  });

  test('save accepts valid config and persists it', () => {
    const config = new Config();

    const newConfig = {
      ...config.config,
      shortcutMap: 'macos',
    };

    config.save(newConfig);

    expect(config.getProperty('shortcutMap')).toBe('macos');

    // Verify persistence by creating a new Config instance
    const config2 = new Config();
    expect(config2.getProperty('shortcutMap')).toBe('macos');
  });

  test('save rejects config with extra property', () => {
    const config = new Config();

    const invalidConfig = {
      ...config.config,
      extraField: 'should-fail',
    };

    expect(() => config.save(invalidConfig as unknown as typeof config.config)).toThrow(ZodError);
  });

  test('save rejects config with invalid searchEngine', () => {
    const config = new Config();

    const invalidConfig = {
      ...config.config,
      searchEngines: [{ code: 123, label: 'Bad', url: 'https://bad.com' }],
    };

    expect(() => config.save(invalidConfig as unknown as typeof config.config)).toThrow(ZodError);
  });

  test('isStandardPermissions returns correct boolean', () => {
    const config = new Config();
    expect(config.isStandardPermissions).toBe(true);

    // Change to strict and verify
    const newConfig = { ...config.config, permissionsType: 'strict' as const };
    config.save(newConfig);
    expect(config.isStandardPermissions).toBe(false);
  });

  test('getProperty caches the validated store: second read does not re-parse', () => {
    const config = new Config();
    const parseSpy = vi.spyOn(ConfigScheme, 'parse');

    config.getProperty('shortcutMap');
    expect(parseSpy).toHaveBeenCalledTimes(1);

    config.getProperty('shortcutMap');
    expect(parseSpy).toHaveBeenCalledTimes(1);

    parseSpy.mockRestore();
  });

  test('save() invalidates the cache: next read re-parses the new config once', () => {
    const config = new Config();
    const parseSpy = vi.spyOn(ConfigScheme, 'parse');

    config.getProperty('shortcutMap');
    expect(parseSpy).toHaveBeenCalledTimes(1);

    const newConfig = { ...config.config, shortcutMap: 'macos' };
    config.save(newConfig);

    // save() validates its input (+1) and invalidates the cache via the raw
    // 'change' event; the next read re-parses once (+1), then stays cached.
    expect(config.getProperty('shortcutMap')).toBe('macos');
    expect(parseSpy).toHaveBeenCalledTimes(3);

    expect(config.getProperty('shortcutMap')).toBe('macos');
    expect(parseSpy).toHaveBeenCalledTimes(3);

    parseSpy.mockRestore();
  });

  test('config.set() (Conf base method) invalidates the cache: next read re-parses once', () => {
    const config = new Config();
    const parseSpy = vi.spyOn(ConfigScheme, 'parse');

    expect(config.getProperty('closedTabsRetentionDays')).toBe(7);
    expect(parseSpy).toHaveBeenCalledTimes(1);

    config.set('closedTabsRetentionDays', 0);
    expect(config.getProperty('closedTabsRetentionDays')).toBe(0);
    expect(parseSpy).toHaveBeenCalledTimes(2);

    parseSpy.mockRestore();
  });

  test('config getter returns a shallow copy: mutation does not poison the cache', () => {
    const config = new Config();

    const firstCopy = config.config;
    firstCopy.shortcutMap = 'mutated';

    expect(config.config.shortcutMap).toBe('generic-ansi');
    expect(config.getProperty('shortcutMap')).toBe('generic-ansi');
  });
});

describe('Config.createTag', () => {
  test('creates a tag and persists it', () => {
    const config = new Config();

    const tag = config.createTag('My Tag', '#ff0000');

    expect(tag.name).toBe('my-tag');
    expect(tag.color).toBe('#ff0000');
    expect(tag.id).toBeTruthy();

    expect(config.getProperty('tags')).toEqual([tag]);

    const config2 = new Config();
    expect(config2.getProperty('tags')).toEqual([tag]);
  });

  test('generates a different id for each tag', () => {
    const config = new Config();

    const first = config.createTag('My Tag', '#ff0000');
    const second = config.createTag('Other Tag', '#00ff00');

    expect(first.id).not.toBe(second.id);
  });

  test('picks a readable text color for a light background', () => {
    const config = new Config();

    expect(config.createTag('White', '#ffffff').textColor).toBe('#000000');
    expect(config.createTag('Yellow', '#ffff00').textColor).toBe('#000000');
    expect(config.createTag('Red', '#ff0000').textColor).toBe('#000000');
  });

  test('picks a readable text color for a dark background', () => {
    const config = new Config();

    expect(config.createTag('Black', '#000000').textColor).toBe('#ffffff');
    expect(config.createTag('Blue', '#0000ff').textColor).toBe('#ffffff');
    expect(config.createTag('Brown', '#8b4513').textColor).toBe('#ffffff');
  });

  test('picks a readable text color for a short hex color', () => {
    const config = new Config();

    expect(config.createTag('Light', '#fff').textColor).toBe('#000000');
    expect(config.createTag('Dark', '#000').textColor).toBe('#ffffff');
  });

  test('slugifies the given name', () => {
    const config = new Config();

    expect(config.createTag('My Tag', '#ff0000').name).toBe('my-tag');
    expect(config.createTag('Ünïcödé Tag', '#ff0000').name).toBe('unicode-ta');
    expect(config.createTag('  Spaces  ', '#ff0000').name).toBe('spaces');
  });

  test('cuts the slug to 10 characters', () => {
    const config = new Config();

    const tag = config.createTag('ThisIsAVeryLongTagName', '#ff0000');

    expect(tag.name).toBe('thisisaver');
    expect(tag.name.length).toBe(10);
  });

  test('throws when the slug is shorter than 3 characters', () => {
    const config = new Config();

    expect(() => config.createTag('a', '#ff0000')).toThrow();
    expect(() => config.createTag('ab', '#ff0000')).toThrow();
    expect(() => config.createTag('!!!', '#ff0000')).toThrow();
    expect(() => config.createTag('   ', '#ff0000')).toThrow();

    expect(config.getProperty('tags')).toEqual([]);
  });

  test('does not create a duplicate tag', () => {
    const config = new Config();

    config.createTag('My Tag', '#ff0000');
    config.createTag('My Tag', '#ff0000');

    expect(config.getProperty('tags')).toHaveLength(1);
  });

  test('returns the existing tag with its original color', () => {
    const config = new Config();

    const created = config.createTag('My Tag', '#ff0000');
    const existing = config.createTag('My Tag', '#00ff00');

    expect(existing).toEqual(created);
    expect(existing.color).toBe('#ff0000');
    expect(existing.id).toBe(created.id);
    expect(config.getProperty('tags')).toEqual([created]);
  });

  test('works with a config file written by an older version, without tags', () => {
    const configPath = getConfigFilePath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        searchEngines: [],
        partitions: [],
        downloadsFolder: '/tmp',
        themes: [],
        permissionsType: 'standard',
        shortcutMap: 'generic-ansi',
        shortcutsOverrides: {},
      }),
    );

    const config = new Config();
    expect(config.getProperty('tags')).toEqual([]);

    const tag = config.createTag('My Tag', '#ff0000');
    expect(tag.name).toBe('my-tag');
    expect(tag.color).toBe('#ff0000');

    const config2 = new Config();
    expect(config2.getProperty('tags')).toEqual([tag]);
  });
});

describe('Config.removeTag', () => {
  beforeEach(() => {
    tabTags.removeTab(12);
    tabTags.removeTab(13);
  });

  afterEach(() => {
    tabTags.removeTab(12);
    tabTags.removeTab(13);
  });

  test('removes the tag from the config', () => {
    const config = new Config();

    const tag = config.createTag('My Tag', '#ff0000');
    config.removeTag(tag.id);

    expect(config.getProperty('tags')).toEqual([]);
  });

  test('removes the tag from the tabs that had it', () => {
    const config = new Config();

    const tag = config.createTag('My Tag', '#ff0000');
    tabTags.assign(12, tag.id);
    tabTags.assign(13, tag.id);

    config.removeTag(tag.id);

    expect(tabTags.get(12)).toEqual([]);
    expect(tabTags.get(13)).toEqual([]);
  });

  test('keeps the other tags and their assignments', () => {
    const config = new Config();

    const removed = config.createTag('My Tag', '#ff0000');
    const kept = config.createTag('Other Tag', '#00ff00');

    tabTags.assign(12, removed.id);
    tabTags.assign(12, kept.id);

    config.removeTag(removed.id);

    expect(config.getProperty('tags')).toEqual([kept]);
    expect(tabTags.get(12)).toEqual([kept.id]);
  });

  test('does nothing when the tag does not exist', () => {
    const config = new Config();

    const tag = config.createTag('My Tag', '#ff0000');
    tabTags.assign(12, tag.id);

    config.removeTag('unknown-tag-id');

    expect(config.getProperty('tags')).toEqual([tag]);
    expect(tabTags.get(12)).toEqual([tag.id]);
  });
});

describe('Config.saveTags', () => {
  beforeEach(() => {
    tabTags.removeTab(12);
    tabTags.removeTab(13);
  });

  afterEach(() => {
    tabTags.removeTab(12);
    tabTags.removeTab(13);
  });

  test('creates a tag with an id and a readable text color', () => {
    const config = new Config();

    config.saveTags([{ name: 'My Tag', color: '#ffffff' }]);

    const tags = config.getProperty('tags');
    expect(tags).toHaveLength(1);
    expect(tags[0].id).toBeTruthy();
    expect(tags[0].name).toBe('my-tag');
    expect(tags[0].color).toBe('#ffffff');
    expect(tags[0].textColor).toBe('#000000');
  });

  test('keeps the id of a tag that already existed', () => {
    const config = new Config();

    const tag = config.createTag('My Tag', '#ff0000');
    config.saveTags([{ name: 'My Tag', color: '#ff0000' }]);

    expect(config.getProperty('tags')[0].id).toBe(tag.id);
  });

  test('updates the color and the text color of an existing tag', () => {
    const config = new Config();

    config.createTag('My Tag', '#ff0000');
    config.saveTags([{ name: 'My Tag', color: '#000000' }]);

    const tags = config.getProperty('tags');
    expect(tags[0].color).toBe('#000000');
    expect(tags[0].textColor).toBe('#ffffff');
  });

  test('slugifies the given name', () => {
    const config = new Config();

    config.saveTags([{ name: 'My Tag', color: '#ffffff' }]);

    expect(config.getProperty('tags')[0].name).toBe('my-tag');
  });

  test('rejects a name that slugifies to less than 3 characters', () => {
    const config = new Config();

    expect(() => config.saveTags([{ name: 'ab', color: '#ffffff' }])).toThrow();
  });

  test('rejects two names that slugify to the same tag', () => {
    const config = new Config();

    expect(() =>
      config.saveTags([
        { name: 'My Tag', color: '#ffffff' },
        { name: 'my-tag', color: '#000000' },
      ]),
    ).toThrow();
  });

  test('removes the tags that are not in the given list', () => {
    const config = new Config();

    config.createTag('My Tag', '#ff0000');
    config.createTag('Other Tag', '#00ff00');

    config.saveTags([{ name: 'My Tag', color: '#ff0000' }]);

    expect(config.getProperty('tags')).toHaveLength(1);
    expect(config.getProperty('tags')[0].name).toBe('my-tag');
  });

  test('removes the tags that are gone from the tabs that had them', () => {
    const config = new Config();

    const tag = config.createTag('My Tag', '#ff0000');
    tabTags.assign(12, tag.id);

    config.saveTags([]);

    expect(tabTags.get(12)).toEqual([]);
  });
});
