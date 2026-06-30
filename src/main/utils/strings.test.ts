import { describe, expect, test } from 'vitest';
import { DEFAULT_MAX_LENGTH, truncate } from './strings';

describe('truncate', () => {
  test('returns empty string unchanged', () => {
    expect(truncate('')).toBe('');
  });

  test('returns string shorter than max unchanged', () => {
    expect(truncate('hello')).toBe('hello');
  });

  test('returns string equal to max unchanged', () => {
    const text = 'a'.repeat(DEFAULT_MAX_LENGTH);
    expect(truncate(text)).toBe(text);
    expect(truncate(text).length).toBe(DEFAULT_MAX_LENGTH);
  });

  test('truncates string longer than max with ellipsis', () => {
    const text = 'a'.repeat(41);
    const result = truncate(text);
    expect(result.length).toBe(40);
    expect(result.endsWith('...')).toBe(true);
    expect(result).toBe(`${'a'.repeat(37)}...`);
  });

  test('truncates long string (200 chars) to max', () => {
    const text = 'x'.repeat(200);
    const result = truncate(text);
    expect(result.length).toBe(DEFAULT_MAX_LENGTH);
    expect(result).toBe(`${'x'.repeat(DEFAULT_MAX_LENGTH - 3)}...`);
  });

  test('preserves content prefix when truncating', () => {
    const result = truncate('https://example.com/some/very/long/path', 20);
    expect(result.length).toBe(20);
    expect(result.startsWith('https://example')).toBe(true);
    expect(result.endsWith('...')).toBe(true);
  });

  test('accepts custom max length', () => {
    expect(truncate('hello world', 5)).toBe('he...');
    expect(truncate('hi', 5)).toBe('hi');
    expect(truncate('hello', 5)).toBe('hello');
  });
});
