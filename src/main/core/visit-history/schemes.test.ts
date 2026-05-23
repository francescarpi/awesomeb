import { expect, test, describe } from 'vitest';
import {
  TransitionTypeScheme,
  VisitItemScheme,
  HistoryItemScheme,
  VisitHistoryStoreScheme,
} from './schemes';
import { ZodError } from 'zod';

const validVisitItem = {
  visitId: 'visit-1',
  url: 'https://example.com',
  title: 'Example',
  visitTime: 1234567890,
  referringVisitId: '',
  transition: 'link' as const,
  isLocal: false,
};

const validHistoryItem = {
  id: 'https://example.com',
  url: 'https://example.com',
  title: 'Example',
  lastVisitTime: 1234567890,
  visitCount: 1,
  visits: [validVisitItem],
};

const validStore = {
  history: [validHistoryItem],
};

describe('TransitionTypeScheme', () => {
  test('valid transition types parse', () => {
    const validTypes = [
      'link',
      'typed',
      'auto_bookmark',
      'auto_subframe',
      'manual_subframe',
      'generated',
      'auto_toplevel',
      'form_submit',
      'reload',
      'keyword',
      'keyword_generated',
    ];

    for (const type of validTypes) {
      expect(TransitionTypeScheme.parse(type)).toBe(type);
    }
  });

  test('invalid transition type throws', () => {
    expect(() => TransitionTypeScheme.parse('invalid')).toThrow(ZodError);
  });
});

describe('VisitItemScheme', () => {
  test('valid VisitItem parses', () => {
    expect(VisitItemScheme.parse(validVisitItem)).toEqual(validVisitItem);
  });

  test('extra field in VisitItem throws (strict mode)', () => {
    const invalid = { ...validVisitItem, extra: true };
    expect(() => VisitItemScheme.parse(invalid)).toThrow(ZodError);
  });

  test('missing required field throws', () => {
    const invalid = { ...validVisitItem };
    delete (invalid as Record<string, unknown>).visitId;
    expect(() => VisitItemScheme.parse(invalid)).toThrow(ZodError);
  });

  test('invalid visitTime type throws', () => {
    const invalid = { ...validVisitItem, visitTime: 'not-a-number' };
    expect(() => VisitItemScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('HistoryItemScheme', () => {
  test('valid HistoryItem parses', () => {
    expect(HistoryItemScheme.parse(validHistoryItem)).toEqual(validHistoryItem);
  });

  test('extra field in HistoryItem throws (strict mode)', () => {
    const invalid = { ...validHistoryItem, extra: true };
    expect(() => HistoryItemScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('VisitHistoryStoreScheme', () => {
  test('valid store parses', () => {
    expect(VisitHistoryStoreScheme.parse(validStore)).toEqual(validStore);
  });

  test('extra property throws', () => {
    const invalid = { ...validStore, extra: true };
    expect(() => VisitHistoryStoreScheme.parse(invalid)).toThrow(ZodError);
  });
});
