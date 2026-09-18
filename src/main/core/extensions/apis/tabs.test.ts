import { describe, expect, test } from 'vitest';
import { buildTabURL } from './tabs';

describe('buildTabURL', () => {
  const extensionId = 'test-extension';
  const partitionId = 'test-partition';

  test('preserves absolute external URLs', () => {
    expect(buildTabURL(extensionId, 'https://github.com/example/repo', partitionId, 42)).toBe(
      'https://github.com/example/repo?partitionId=test-partition&winId=42',
    );
  });

  test('resolves extension-relative URLs and keeps fragments after the query', () => {
    expect(buildTabURL(extensionId, 'pages/options.html#advanced', partitionId, 42)).toBe(
      'chrome-extension://test-extension/pages/options.html?partitionId=test-partition&winId=42#advanced',
    );
  });

  test('preserves existing query parameters', () => {
    expect(
      buildTabURL(extensionId, 'https://example.com/?existing=value#section', partitionId, 42),
    ).toBe('https://example.com/?existing=value&partitionId=test-partition&winId=42#section');
  });

  test('rejects unsupported schemes', () => {
    expect(buildTabURL(extensionId, 'javascript:alert(1)', partitionId, 42)).toBeNull();
  });
});
