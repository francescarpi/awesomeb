import { describe, it, expect } from 'vitest';
import { highlightString } from './string';

describe('highlightString', () => {
  it('should add mark to single range', () => {
    const result = highlightString('hola mundo', [[0, 2]]);
    expect(result).toBe('<mark>ho</mark>la mundo');
  });

  it('should add marks to multiple ranges', () => {
    const result = highlightString('hola mundo', [
      [0, 2],
      [5, 10],
    ]);
    expect(result).toBe('<mark>ho</mark>la <mark>mundo</mark>');
  });

  it('should handle adjacent ranges', () => {
    const result = highlightString('hello', [
      [0, 2],
      [2, 5],
    ]);
    expect(result).toBe('<mark>he</mark><mark>llo</mark>');
  });

  it('should handle empty ranges array', () => {
    const result = highlightString('hello', []);
    expect(result).toBe('hello');
  });

  it('should handle ranges out of order', () => {
    const result = highlightString('hello world', [
      [6, 11],
      [0, 5],
    ]);
    expect(result).toBe('<mark>hello</mark> <mark>world</mark>');
  });
});
