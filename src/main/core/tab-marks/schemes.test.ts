import { expect, test, describe } from 'vitest';
import { TabMarkScheme, MarksStoreScheme } from './schemes';
import { ZodError } from 'zod';

const validTabMark = {
  trigger: 'test-trigger',
  tabId: 42,
  title: 'Test Title',
};

const validStore = {
  marks: [validTabMark],
};

describe('TabMarkScheme', () => {
  test('valid tab mark parses', () => {
    expect(TabMarkScheme.parse(validTabMark)).toEqual(validTabMark);
  });

  test('missing field throws', () => {
    const invalid = { ...validTabMark };
    delete (invalid as Record<string, unknown>).title;
    expect(() => TabMarkScheme.parse(invalid)).toThrow(ZodError);
  });

  test('tabId as string throws', () => {
    const invalid = { ...validTabMark, tabId: '42' };
    expect(() => TabMarkScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws (strict)', () => {
    const invalid = { ...validTabMark, extra: true };
    expect(() => TabMarkScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('MarksStoreScheme', () => {
  test('valid store with empty marks parses', () => {
    const store = { marks: [] };
    expect(MarksStoreScheme.parse(store)).toEqual(store);
  });

  test('valid store with marks parses', () => {
    expect(MarksStoreScheme.parse(validStore)).toEqual(validStore);
  });

  test('invalid child throws', () => {
    const invalid = {
      marks: [{ trigger: 'bad', tabId: 'not-a-number', title: 'Bad' }],
    };
    expect(() => MarksStoreScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws (strict)', () => {
    const invalid = { ...validStore, extra: true };
    expect(() => MarksStoreScheme.parse(invalid)).toThrow(ZodError);
  });
});
