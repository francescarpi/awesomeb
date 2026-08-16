import { describe, expect, test } from 'vitest';
import { FALLBACK_CHAIN, isLocale, detectSystemLocale } from './index';

describe('isLocale', () => {
  test('returns true for known locales', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('es')).toBe(true);
    expect(isLocale('ca')).toBe(true);
  });

  test('returns false for unknown strings', () => {
    expect(isLocale('xx')).toBe(false);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('EN')).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  test('returns false for non-string values', () => {
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
    expect(isLocale({})).toBe(false);
    expect(isLocale([])).toBe(false);
    expect(isLocale(true)).toBe(false);
  });
});

describe('detectSystemLocale', () => {
  test('detects es from "es-ES"', () => {
    expect(detectSystemLocale('es-ES')).toBe('es');
  });

  test('detects ca from "ca-ES"', () => {
    expect(detectSystemLocale('ca-ES')).toBe('ca');
  });

  test('detects en from "en-US"', () => {
    expect(detectSystemLocale('en-US')).toBe('en');
  });

  test('falls back to en for unsupported locales', () => {
    expect(detectSystemLocale('fr-FR')).toBe('en');
    expect(detectSystemLocale('de-DE')).toBe('en');
    expect(detectSystemLocale('ja-JP')).toBe('en');
  });

  test('handles locale strings without region', () => {
    expect(detectSystemLocale('es')).toBe('es');
    expect(detectSystemLocale('ca')).toBe('ca');
    expect(detectSystemLocale('en')).toBe('en');
  });
});

describe('FALLBACK_CHAIN', () => {
  test('en falls back to itself only', () => {
    expect(FALLBACK_CHAIN.en).toEqual(['en']);
  });

  test('es falls back to es then en', () => {
    expect(FALLBACK_CHAIN.es).toEqual(['es', 'en']);
  });

  test('ca falls back to ca then es then en', () => {
    expect(FALLBACK_CHAIN.ca).toEqual(['ca', 'es', 'en']);
  });
});
