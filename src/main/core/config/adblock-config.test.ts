import { expect, test, describe } from 'vitest';
import { ConfigScheme } from './schemes';

describe('ConfigScheme ad blocker backwards compatibility', () => {
  test('a config written before the ad blocker existed still validates', () => {
    const legacyConfig = {
      searchEngines: [
        { code: 'google', label: 'Google', url: 'https://google.es/search?query={query}' },
      ],
      partitions: [{ name: 'Feina', color: '#e62222' }],
      downloadsFolder: '/home/user/Downloads',
      themes: [],
      tags: [],
      permissionsType: 'standard' as const,
      shortcutMap: 'generic-ansi',
      shortcutsOverrides: {},
      historyRetentionDays: 7,
      closedTabsRetentionDays: 7,
      closedTabsMaxLength: 30,
      uiTheme: 'cupcake',
    };

    const result = ConfigScheme.parse(legacyConfig);

    expect(result.adBlockEnabled).toBe(true);
    expect(result.partitions).toHaveLength(1);
    expect(result.searchEngines).toHaveLength(1);
  });
});
