import { describe, it, expect } from 'vitest';
import { bestMatchWithRange } from './helpers';

describe('bestMatchWithRange', () => {
  it('should return empty for empty query', () => {
    const urls = ['https://google.com/foo'];
    expect(bestMatchWithRange(urls, '')).toEqual([]);
    expect(bestMatchWithRange(urls, '   ')).toEqual([]);
  });

  it('should return empty for no matching urls', () => {
    const urls = ['https://google.com/foo'];
    expect(bestMatchWithRange(urls, 'bar')).toEqual([]);
  });

  it('should return single range for simple match', () => {
    const urls = ['https://google.com/foo'];
    const result = bestMatchWithRange(urls, 'foo');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('https://google.com/foo');
    expect(result[0].range).toEqual([[19, 22]]);
  });

  it('should return multiple ranges for wildcard match', () => {
    const urls = ['https://google.com/foo'];
    const result = bestMatchWithRange(urls, 'goo*foo');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('https://google.com/foo');
    expect(result[0].range).toEqual([
      [8, 11],
      [19, 22],
    ]);
  });

  it('should handle wildcard at start', () => {
    const urls = ['https://google.com/foo'];
    const result = bestMatchWithRange(urls, '*foo');
    expect(result).toHaveLength(1);
    expect(result[0].range).toEqual([[19, 22]]);
  });

  it('should handle wildcard at end', () => {
    const urls = ['https://google.com/foo'];
    const result = bestMatchWithRange(urls, 'goo*');
    expect(result).toHaveLength(1);
    expect(result[0].range).toEqual([[8, 11]]);
  });

  it('should handle multiple wildcards', () => {
    const urls = ['https://google.com/foo/boo'];
    const result = bestMatchWithRange(urls, 'goo*foo*boo');
    expect(result).toHaveLength(1);
    expect(result[0].range).toEqual([
      [8, 11],
      [19, 22],
      [23, 26],
    ]);
  });

  it('should respect limit', () => {
    const urls = [
      'https://google.com/foo',
      'https://google.com/boo',
      'https://google.com/coo',
      'https://google.com/doo',
    ];
    const result = bestMatchWithRange(urls, 'google', 2);
    expect(result).toHaveLength(2);
  });

  it('should be case insensitive', () => {
    const urls = ['https://GOOGLE.COM/FOO'];
    const result = bestMatchWithRange(urls, 'goo*foo');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('https://GOOGLE.COM/FOO');
  });
});
