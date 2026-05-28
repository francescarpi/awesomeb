import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { Config } from './config';
import { ZodError } from 'zod';
import { userDataPath } from '@/paths';
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

describe('Config', () => {
  beforeEach(() => {
    cleanConfigFile();
  });

  afterEach(() => {
    cleanConfigFile();
  });

  test('constructor with valid defaults succeeds', () => {
    const config = new Config();
    expect(config).toBeDefined();
    expect(config.getProperty('shortcutMap')).toBe('generic-iso');
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
        shortcutMap: 'generic-iso',
        shortcutsOverrides: {},
      }),
    );

    const config = new Config();
    expect(config).toBeDefined();
    expect(config.getProperty('shortcutMap')).toBe('generic-iso');
  });

  test('getProperty validates on read', () => {
    const config = new Config();

    // getProperty should work normally with valid data
    const searchEngines = config.getProperty('searchEngines');
    expect(searchEngines.length).toBeGreaterThan(0);
  });

  test('config getter validates on read', () => {
    const config = new Config();
    const fullConfig = config.config;
    expect(fullConfig.shortcutMap).toBe('generic-iso');
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

  test('defaultSearchEngine returns first search engine', () => {
    const config = new Config();
    const defaultEngine = config.defaultSearchEngine;
    expect(defaultEngine.code).toBe('google');
  });

  test('isStandardPermissions returns correct boolean', () => {
    const config = new Config();
    expect(config.isStandardPermissions).toBe(true);

    // Change to strict and verify
    const newConfig = { ...config.config, permissionsType: 'strict' as const };
    config.save(newConfig);
    expect(config.isStandardPermissions).toBe(false);
  });
});
