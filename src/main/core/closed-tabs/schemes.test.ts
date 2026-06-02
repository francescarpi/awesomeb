import { expect, test, describe } from 'vitest';
import { ClosedTabScheme, ClosedTabsScheme } from './schemes';
import { ZodError } from 'zod';

const validClosedTab = {
  title: 'Example',
  url: 'https://example.com',
  timestamp: 1234567890,
  index: 0,
  entries: [],
};

const validStore = {
  tabs: [validClosedTab],
};

describe('ClosedTabScheme', () => {
  test('valid closed tab parses', () => {
    expect(ClosedTabScheme.parse(validClosedTab)).toEqual(validClosedTab);
  });

  test('missing field throws', () => {
    const invalid = { ...validClosedTab };
    delete (invalid as Record<string, unknown>).url;

    expect(() => ClosedTabScheme.parse(invalid)).toThrow(ZodError);
  });

  test('timestamp as string throws', () => {
    const invalid = { ...validClosedTab, timestamp: '1234567890' };

    expect(() => ClosedTabScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws', () => {
    const invalid = { ...validClosedTab, extra: true };

    expect(() => ClosedTabScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('ClosedTabsScheme', () => {
  test('valid store with empty tabs parses', () => {
    const store = { tabs: [] };
    const result = ClosedTabsScheme.parse(store);
    expect(result.tabs).toEqual([]);
  });

  test('valid store with tabs parses', () => {
    expect(ClosedTabsScheme.parse(validStore)).toEqual(validStore);
  });

  test('invalid child throws', () => {
    const invalid = {
      tabs: [{ title: 'Bad', url: 'https://bad.com' }],
    };

    expect(() => ClosedTabsScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws', () => {
    const invalid = { ...validStore, extra: true };

    expect(() => ClosedTabsScheme.parse(invalid)).toThrow(ZodError);
  });
});
