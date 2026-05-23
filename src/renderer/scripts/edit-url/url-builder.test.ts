import { describe, it, expect } from 'vitest';
import { parseURL, buildURL, parseHashQueryParams, updateURLSearchParams } from './url-builder';

// ---------------------------------------------------------------------------
// parseHashQueryParams
// ---------------------------------------------------------------------------
describe('parseHashQueryParams', () => {
  it('returns empty for empty hash', () => {
    expect(parseHashQueryParams('')).toEqual({ base: '', params: [] });
  });

  it('returns empty for falsy hash', () => {
    expect(parseHashQueryParams('')).toEqual({ base: '', params: [] });
  });

  it('parses hash without query', () => {
    expect(parseHashQueryParams('#section')).toEqual({ base: 'section', params: [] });
  });

  it('parses hash without # prefix', () => {
    expect(parseHashQueryParams('section')).toEqual({ base: 'section', params: [] });
  });

  it('parses hash with query params', () => {
    expect(parseHashQueryParams('#/path?key=value')).toEqual({
      base: '/path',
      params: [{ key: 'key', value: 'value' }],
    });
  });

  it('parses hash with multiple query params', () => {
    expect(parseHashQueryParams('#/path?a=1&b=2')).toEqual({
      base: '/path',
      params: [
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
      ],
    });
  });

  it('parses hash with only query (no base)', () => {
    expect(parseHashQueryParams('#?key=value')).toEqual({
      base: '',
      params: [{ key: 'key', value: 'value' }],
    });
  });

  it('parses hash param with empty value', () => {
    expect(parseHashQueryParams('#/path?key=')).toEqual({
      base: '/path',
      params: [{ key: 'key', value: '' }],
    });
  });

  it('handles hash starting with double ##', () => {
    expect(parseHashQueryParams('##/path?key=value')).toEqual({
      base: '#/path',
      params: [{ key: 'key', value: 'value' }],
    });
  });
});

// ---------------------------------------------------------------------------
// parseURL
// ---------------------------------------------------------------------------
describe('parseURL', () => {
  it('parses a simple URL', () => {
    const result = parseURL('https://example.com/');
    expect(result.protocol).toBe('https');
    expect(result.hostname).toBe('example.com');
    expect(result.port).toBe('');
    expect(result.pathname).toBe('/');
    expect(result.hash).toBe('');
    expect(result.hashParams).toEqual([]);
    expect(result.searchParams).toEqual([]);
  });

  it('parses URL with port', () => {
    const result = parseURL('https://example.com:8080/path');
    expect(result.protocol).toBe('https');
    expect(result.hostname).toBe('example.com');
    expect(result.port).toBe('8080');
    expect(result.pathname).toBe('/path');
  });

  it('parses URL with search params', () => {
    const result = parseURL('https://example.com/page?a=1&b=2');
    expect(result.pathname).toBe('/page');
    expect(result.searchParams).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ]);
    expect(result.hash).toBe('');
    expect(result.hashParams).toEqual([]);
  });

  it('parses URL with hash fragment', () => {
    const result = parseURL('https://example.com/page#section');
    expect(result.hash).toBe('section');
    expect(result.hashParams).toEqual([]);
    expect(result.searchParams).toEqual([]);
  });

  it('parses URL with hash containing query params (SPA route)', () => {
    const result = parseURL('https://example.com/page#/route?key=value');
    expect(result.hash).toBe('/route');
    expect(result.hashParams).toEqual([{ key: 'key', value: 'value' }]);
    expect(result.searchParams).toEqual([]);
  });

  it('parses URL with both search params and hash', () => {
    const result = parseURL('https://example.com/page?a=1#section');
    expect(result.searchParams).toEqual([{ key: 'a', value: '1' }]);
    expect(result.hash).toBe('section');
    expect(result.hashParams).toEqual([]);
  });

  it('parses URL with everything', () => {
    const result = parseURL('https://example.com:3000/path?a=1#/route?b=2');
    expect(result.protocol).toBe('https');
    expect(result.hostname).toBe('example.com');
    expect(result.port).toBe('3000');
    expect(result.pathname).toBe('/path');
    expect(result.searchParams).toEqual([{ key: 'a', value: '1' }]);
    expect(result.hash).toBe('/route');
    expect(result.hashParams).toEqual([{ key: 'b', value: '2' }]);
  });

  it('throws on invalid URL', () => {
    expect(() => parseURL('not-a-url')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// buildURL
// ---------------------------------------------------------------------------
describe('buildURL', () => {
  const baseParts = {
    protocol: 'https',
    hostname: 'example.com',
    port: '',
    pathname: '/',
    hash: '',
    hashParams: [] as Array<{ key: string; value: string }>,
    searchParams: [] as Array<{ key: string; value: string }>,
  };

  it('builds a simple URL', () => {
    const url = buildURL(baseParts, false);
    expect(url).toBe('https://example.com/');
  });

  it('builds URL with port', () => {
    const url = buildURL({ ...baseParts, port: '8080' }, false);
    expect(url).toBe('https://example.com:8080/');
  });

  it('builds URL with pathname', () => {
    const url = buildURL({ ...baseParts, pathname: '/path/to/page' }, false);
    expect(url).toBe('https://example.com/path/to/page');
  });

  it('builds URL with search params (useHashParams=false)', () => {
    const url = buildURL({ ...baseParts, searchParams: [{ key: 'a', value: '1' }] }, false);
    expect(url).toBe('https://example.com/?a=1');
  });

  it('builds URL with hash (useHashParams=false)', () => {
    const url = buildURL({ ...baseParts, hash: 'section' }, false);
    expect(url).toBe('https://example.com/#section');
  });

  it('builds URL with search params and hash (useHashParams=false)', () => {
    const url = buildURL(
      {
        ...baseParts,
        pathname: '/page',
        searchParams: [
          { key: 'a', value: '1' },
          { key: 'b', value: '2' },
        ],
        hash: 'section',
      },
      false,
    );
    expect(url).toBe('https://example.com/page?a=1&b=2#section');
  });

  it('builds URL with hash params (useHashParams=true)', () => {
    const url = buildURL(
      {
        ...baseParts,
        pathname: '/app',
        hash: '/route',
        hashParams: [{ key: 'key', value: 'value' }],
      },
      true,
    );
    expect(url).toBe('https://example.com/app#/route?key=value');
  });

  it('builds URL with multiple hash params (useHashParams=true)', () => {
    const url = buildURL(
      {
        ...baseParts,
        pathname: '/app',
        hash: '/route',
        hashParams: [
          { key: 'a', value: '1' },
          { key: 'b', value: '2' },
        ],
      },
      true,
    );
    expect(url).toBe('https://example.com/app#/route?a=1&b=2');
  });

  it('filters out entries where both key and value are empty', () => {
    const url = buildURL(
      {
        ...baseParts,
        searchParams: [
          { key: 'a', value: '1' },
          { key: '', value: '' },
          { key: 'b', value: '2' },
        ],
      },
      false,
    );
    expect(url).toBe('https://example.com/?a=1&b=2');
  });

  it('keeps entries where key is empty but value is present', () => {
    const url = buildURL(
      {
        ...baseParts,
        searchParams: [{ key: '', value: 'justvalue' }],
      },
      false,
    );
    expect(url).toBe('https://example.com/?=justvalue');
  });

  it('builds hash params even when searchParams exist (useHashParams=true)', () => {
    const url = buildURL(
      {
        ...baseParts,
        pathname: '/app',
        hash: '/route',
        hashParams: [{ key: 'h', value: '1' }],
        searchParams: [{ key: 's', value: '2' }],
      },
      true,
    );
    expect(url).toBe('https://example.com/app#/route?h=1');
  });

  it('builds roundtrip: parseURL then buildURL preserves URL (useHashParams=false)', () => {
    const original = 'https://example.com:3000/path?a=1&b=2#section';
    const parts = parseURL(original);
    const rebuilt = buildURL(parts, false);
    expect(rebuilt).toBe(original);
  });

  it('builds roundtrip: parseURL then buildURL preserves URL (useHashParams=true)', () => {
    const original = 'https://example.com:3000/app#/route?key=value';
    const parts = parseURL(original);
    const rebuilt = buildURL(parts, true);
    expect(rebuilt).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// updateURLSearchParams
// ---------------------------------------------------------------------------
describe('updateURLSearchParams', () => {
  it('replaces search params (useHashParams=false)', () => {
    const result = updateURLSearchParams(
      'https://example.com/page?a=1&b=2',
      [{ key: 'c', value: '3' }],
      false,
    );
    expect(result).toBe('https://example.com/page?c=3');
  });

  it('replaces hash params (useHashParams=true)', () => {
    const result = updateURLSearchParams(
      'https://example.com/app#/route?old=1',
      [{ key: 'new', value: '2' }],
      true,
    );
    expect(result).toBe('https://example.com/app#/route?new=2');
  });

  it('preserves hash when updating search params', () => {
    const result = updateURLSearchParams(
      'https://example.com/page?a=1#section',
      [{ key: 'b', value: '2' }],
      false,
    );
    expect(result).toBe('https://example.com/page?b=2#section');
  });

  it('preserves pathname and port when updating params', () => {
    const result = updateURLSearchParams(
      'https://example.com:8080/path/to/page?a=1',
      [{ key: 'b', value: '2' }],
      false,
    );
    expect(result).toBe('https://example.com:8080/path/to/page?b=2');
  });

  it('handles empty params array', () => {
    const result = updateURLSearchParams('https://example.com/page?a=1', [], false);
    expect(result).toBe('https://example.com/page');
  });

  it('throws on invalid URL', () => {
    expect(() => updateURLSearchParams('not-a-url', [{ key: 'a', value: '1' }], false)).toThrow();
  });
});
