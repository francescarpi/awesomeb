import { expect, test, describe } from 'vitest';
import { NavigationEntryScheme, SessionHistoryTabScheme, SessionHistoryScheme } from './schemes';
import { ZodError } from 'zod';

describe('NavigationEntryScheme', () => {
  test('valid NavigationEntry parses successfully', () => {
    const entry = { title: 'Example', url: 'https://example.com' };
    const result = NavigationEntryScheme.parse(entry);
    expect(result).toEqual(entry);
  });

  test('missing title throws ZodError', () => {
    const invalid = { url: 'https://example.com' };
    expect(() => NavigationEntryScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('SessionHistoryTabScheme', () => {
  test('valid SessionHistoryTab parses successfully', () => {
    const tab = { index: 1, entries: [{ title: 'Example', url: 'https://example.com' }] };
    const result = SessionHistoryTabScheme.parse(tab);
    expect(result).toEqual(tab);
  });
});

describe('SessionHistoryScheme', () => {
  test('valid SessionHistory with empty tabs parses successfully', () => {
    const history = { tabs: {} };
    const result = SessionHistoryScheme.parse(history);
    expect(result).toEqual(history);
  });

  test('valid SessionHistory with entries parses successfully', () => {
    const history = {
      tabs: {
        'tab-1': { index: 0, entries: [{ title: 'Example', url: 'https://example.com' }] },
      },
    };
    const result = SessionHistoryScheme.parse(history);
    expect(result).toEqual(history);
  });

  test('extra property throws ZodError due to strict mode', () => {
    const invalid = { tabs: {}, extra: true };
    expect(() => SessionHistoryScheme.parse(invalid)).toThrow(ZodError);
  });
});
