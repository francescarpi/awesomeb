import { expect, test, describe } from 'vitest';
import {
  ExtensionActionScheme,
  ExtensionManifestScheme,
  ExtensionScheme,
  ExtensionsStoreScheme,
} from './schemes';
import { ZodError } from 'zod';

const validExtensionAction = {
  default_icon: 'icon.png',
  default_popup: 'popup.html',
};

const validExtensionManifest = {
  action: validExtensionAction,
  description: 'Test Extension',
  homepage_url: 'https://example.com',
  host_permissions: ['*://*/*'],
  icons: { '16': 'icon16.png' },
  key: 'test-key',
  manifest_version: 3,
  name: 'Test Extension',
  permissions: ['tabs'],
  udpate_url: 'https://example.com/update',
  version: '1.0.0',
};

const validExtension = {
  id: 'test-extension',
  manifest: validExtensionManifest,
  manifestPath: '/path/to/manifest.json',
  icon: 'icon.png',
  enabled: true,
};

const validStore = {
  extensions: {
    'test-extension': validExtension,
  },
};

describe('ExtensionActionScheme', () => {
  test('valid action parses', () => {
    expect(ExtensionActionScheme.parse(validExtensionAction)).toEqual(validExtensionAction);
  });

  test('default_icon as record parses', () => {
    const action = { default_icon: { '16': 'icon16.png' }, default_popup: 'popup.html' };
    expect(ExtensionActionScheme.parse(action)).toEqual(action);
  });
});

describe('ExtensionManifestScheme', () => {
  test('valid manifest parses', () => {
    expect(ExtensionManifestScheme.parse(validExtensionManifest)).toEqual(validExtensionManifest);
  });

  test('missing manifest field throws', () => {
    const invalid = { ...validExtensionManifest, description: undefined };
    expect(() => ExtensionManifestScheme.parse(invalid)).toThrow(ZodError);
  });

  test('invalid manifest_version throws', () => {
    const invalid = { ...validExtensionManifest, manifest_version: '3' };
    expect(() => ExtensionManifestScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property is allowed via passthrough', () => {
    const withExtra = { ...validExtensionManifest, extra: true };
    const result = ExtensionManifestScheme.parse(withExtra);
    expect(result).toHaveProperty('extra');
  });
});

describe('ExtensionScheme', () => {
  test('valid extension parses', () => {
    expect(ExtensionScheme.parse(validExtension)).toEqual(validExtension);
  });

  test('icon as null parses', () => {
    const ext = { ...validExtension, icon: null };
    expect(ExtensionScheme.parse(ext)).toEqual(ext);
  });

  test('extra property throws (strict)', () => {
    const invalid = { ...validExtension, extra: true };
    expect(() => ExtensionScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('ExtensionsStoreScheme', () => {
  test('valid store parses', () => {
    expect(ExtensionsStoreScheme.parse(validStore)).toEqual(validStore);
  });

  test('empty extensions parses', () => {
    expect(ExtensionsStoreScheme.parse({ extensions: {} })).toEqual({ extensions: {} });
  });

  test('extra property throws (strict)', () => {
    const invalid = { ...validStore, extra: true };
    expect(() => ExtensionsStoreScheme.parse(invalid)).toThrow(ZodError);
  });
});
