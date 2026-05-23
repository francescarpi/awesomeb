import { expect, test, describe } from 'vitest';
import { PermissionsStoreScheme, PermissionRecordScheme } from './schemes';
import { ZodError } from 'zod';

const validStore = {
  permissions: {
    'example.com': {
      notifications: true,
      microphone: false,
    },
    'test.com': {
      camera: true,
    },
  },
};

describe('PermissionRecordScheme', () => {
  test('valid record parses', () => {
    const record = { notifications: true, camera: false };
    expect(PermissionRecordScheme.parse(record)).toEqual(record);
  });

  test('non-boolean value throws', () => {
    const invalid = { notifications: 'yes' };
    expect(() => PermissionRecordScheme.parse(invalid)).toThrow(ZodError);
  });

  test('empty record parses', () => {
    expect(PermissionRecordScheme.parse({})).toEqual({});
  });
});

describe('PermissionsStoreScheme', () => {
  test('valid store with empty permissions parses', () => {
    const store = { permissions: {} };
    expect(PermissionsStoreScheme.parse(store)).toEqual(store);
  });

  test('valid store with permissions parses', () => {
    expect(PermissionsStoreScheme.parse(validStore)).toEqual(validStore);
  });

  test('extra property throws (strict)', () => {
    const invalid = { ...validStore, extra: true };
    expect(() => PermissionsStoreScheme.parse(invalid)).toThrow(ZodError);
  });

  test('invalid permission value throws', () => {
    const invalid = {
      permissions: {
        'example.com': {
          notifications: 'not-a-boolean',
        },
      },
    };
    expect(() => PermissionsStoreScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property in inner record throws (strict)', () => {
    const invalid = {
      permissions: {
        'example.com': {
          notifications: true,
          extra: 'not-allowed',
        },
      },
    };
    expect(() => PermissionsStoreScheme.parse(invalid)).toThrow(ZodError);
  });
});
