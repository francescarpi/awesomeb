import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { Extensions } from './extensions';
import { Browser, partitions } from '@/core';
import { ExtensionPopup } from './popup';
import { webContents } from 'electron';
import { userDataPath, extensionsPath } from '@/paths';
import path from 'path';
import fs from 'fs';

function getExtensionsFilePath() {
  return path.join(userDataPath(), 'extensions.json');
}

function cleanExtensionsFile() {
  const filePath = getExtensionsFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function cleanExtensionsDirectory() {
  const extPath = extensionsPath();
  if (fs.existsSync(extPath)) {
    fs.rmSync(extPath, { recursive: true, force: true });
  }
}

function createValidExtensionJson(id: string, enabled = false) {
  return {
    id,
    manifest: {
      action: {
        default_icon: 'icon.png',
        default_popup: 'popup.html',
      },
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
    },
    manifestPath: '/path/to/manifest',
    icon: null,
    enabled,
  };
}

describe('Extensions', () => {
  let browser: Browser;

  beforeEach(() => {
    cleanExtensionsFile();
    cleanExtensionsDirectory();
    browser = new Browser();
  });

  afterEach(() => {
    cleanExtensionsFile();
    cleanExtensionsDirectory();
  });

  test('constructor succeeds with valid defaults', () => {
    const extensions = new Extensions(browser);
    expect(extensions).toBeDefined();
    expect(extensions.all).toEqual([]);
  });

  test('constructor with corrupted disk falls back to defaults', () => {
    const filePath = getExtensionsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        extensions: 'not-an-object',
      }),
    );

    const extensions = new Extensions(browser);
    expect(extensions).toBeDefined();
    expect(extensions.all).toEqual([]);
  });

  test('all getter validates on read', () => {
    const extensions = new Extensions(browser);
    expect(extensions.all).toEqual([]);
  });

  test('active getter validates on read', () => {
    const extensions = new Extensions(browser);
    expect(extensions.active).toEqual([]);
  });

  test('toggle() changes enabled state', () => {
    const filePath = getExtensionsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        extensions: {
          'test-ext': createValidExtensionJson('test-ext', false),
        },
      }),
    );

    const extensions = new Extensions(browser);
    // Mock async side effect to avoid unhandled rejections in test environment
    extensions.loadUnloadExtensionToAllSessions = async () => {};

    expect(extensions.getExtension('test-ext')?.enabled).toBe(false);

    const result = extensions.toggle('test-ext');
    expect(result).not.toBeNull();
    expect(result?.enabled).toBe(true);
    expect(extensions.getExtension('test-ext')?.enabled).toBe(true);

    extensions.toggle('test-ext');
    expect(extensions.getExtension('test-ext')?.enabled).toBe(false);
  });

  test('toggle() returns null for missing extension', () => {
    const extensions = new Extensions(browser);
    expect(extensions.toggle('non-existent')).toBeNull();
  });

  test('refresh() processes extensions from disk', () => {
    const extPath = extensionsPath();
    const manifestDir = path.join(extPath, 'test-ext', '1.0.0');
    fs.mkdirSync(manifestDir, { recursive: true });
    fs.writeFileSync(
      path.join(manifestDir, 'manifest.json'),
      JSON.stringify({
        action: {
          default_icon: 'icon.png',
          default_popup: 'popup.html',
        },
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
      }),
    );

    const extensions = new Extensions(browser);
    expect(extensions.all).toHaveLength(0);

    extensions.refresh();
    expect(extensions.all).toHaveLength(1);
    expect(extensions.all[0].id).toBe('test-ext');
  });

  test('getExtension() returns null for missing extension', () => {
    const extensions = new Extensions(browser);
    expect(extensions.getExtension('non-existent')).toBeNull();
  });

  test('limits preferred size changes to one additional change per burst', () => {
    vi.useFakeTimers();
    partitions.init();

    let onPreferredSizeChanged:
      ((event: unknown, size: { width: number; height: number }) => void) | undefined;
    const webContentsOn = vi.spyOn(webContents, 'on') as any;
    webContentsOn.mockImplementation((...args: any[]) => {
      const [event, listener] = args;
      if (event === 'preferred-size-changed') {
        onPreferredSizeChanged = listener;
      }
      return webContents;
    });

    const setSize = vi.spyOn(ExtensionPopup.prototype, 'setSize');
    const registerPreferredSizeEvent = vi.spyOn(
      ExtensionPopup.prototype,
      'registerPreferredSizeEvent',
    );
    vi.spyOn(ExtensionPopup.prototype, 'refreshBounds').mockImplementation(() => {});
    vi.spyOn(ExtensionPopup.prototype, 'setVisible');

    const filePath = getExtensionsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({ extensions: { 'test-ext': createValidExtensionJson('test-ext') } }),
    );

    const extensions = new Extensions(browser);
    const window = {
      id: 1,
      addView: vi.fn(),
      getView: () => ({ bounds: { width: 100 } }),
      renderViews: vi.fn(),
      removeView: vi.fn(),
    };

    extensions.openPopup('test-ext', window as never, partitions.internal, 0, 0);

    expect(registerPreferredSizeEvent).toHaveBeenCalledWith(window);
    expect(onPreferredSizeChanged).toBeDefined();

    onPreferredSizeChanged!(null, { width: 0, height: 100 });
    onPreferredSizeChanged!(null, { width: Number.NaN, height: 100 });
    expect(setSize).not.toHaveBeenCalled();

    onPreferredSizeChanged!(null, { width: 225, height: 100 });
    onPreferredSizeChanged!(null, { width: 300, height: 150 });
    onPreferredSizeChanged!(null, { width: 400, height: 200 });

    expect(setSize).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(100);
    onPreferredSizeChanged!(null, { width: 500, height: 250 });
    expect(setSize).toHaveBeenCalledTimes(3);

    extensions.closePopup(window as never);
    extensions.openPopup('test-ext', window as never, partitions.internal, 0, 0);
    expect(onPreferredSizeChanged).toBeDefined();
    onPreferredSizeChanged!(null, { width: 600, height: 300 });
    onPreferredSizeChanged!(null, { width: 700, height: 350 });
    expect(setSize).toHaveBeenCalledTimes(5);

    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});
