import { describe, expect, test } from 'vitest';
import { buildTabURL } from './tabs';

describe('buildTabURL', () => {
  const extensionId = 'test-extension';

  test('preserves absolute external URLs', () => {
    expect(buildTabURL(extensionId, 'https://github.com/example/repo')).toBe(
      'https://github.com/example/repo',
    );
  });

  test('resolves extension-relative URLs and keeps fragments after the query', () => {
    expect(buildTabURL(extensionId, 'pages/options.html#advanced')).toBe(
      'chrome-extension://test-extension/pages/options.html#advanced',
    );
  });

  test('preserves existing query parameters', () => {
    expect(buildTabURL(extensionId, 'https://example.com/?existing=value#section')).toBe(
      'https://example.com/?existing=value#section',
    );
  });

  test('rejects unsupported schemes', () => {
    expect(buildTabURL(extensionId, 'javascript:alert(1)')).toBeNull();
  });
});
