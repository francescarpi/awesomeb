import { expect, test, describe } from 'vitest';
import { z } from 'zod';
import { validateStore } from './validation';

const TestScheme = z
  .object({
    name: z.string(),
    count: z.number(),
  })
  .strict();

const defaults = { name: 'default', count: 0 };

describe('validateStore', () => {
  test('returns validated data when valid', () => {
    const result = validateStore(TestScheme, { name: 'test', count: 5 }, 'Test', defaults);
    expect(result).toEqual({ name: 'test', count: 5 });
  });

  test('returns defaults when data is invalid', () => {
    const result = validateStore(TestScheme, { name: 123, count: 'bad' }, 'Test', defaults);
    expect(result).toEqual(defaults);
  });

  test('returns defaults when data is missing required fields', () => {
    const result = validateStore(TestScheme, { name: 'test' }, 'Test', defaults);
    expect(result).toEqual(defaults);
  });

  test('returns defaults when data has extra fields (strict mode)', () => {
    const result = validateStore(
      TestScheme,
      { name: 'test', count: 5, extra: 'field' },
      'Test',
      defaults,
    );
    expect(result).toEqual(defaults);
  });

  test('returns defaults when data is completely wrong type', () => {
    const result = validateStore(TestScheme, 'not-an-object', 'Test', defaults);
    expect(result).toEqual(defaults);
  });

  test('passes through valid data that matches defaults', () => {
    const result = validateStore(TestScheme, { name: 'default', count: 0 }, 'Test', defaults);
    expect(result).toEqual(defaults);
  });
});
