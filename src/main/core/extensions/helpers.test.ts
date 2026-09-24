import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadIcon } from './helpers';

describe('loadIcon', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'awesomeb-loadicon-'));
    fs.mkdirSync(path.join(tmpRoot, 'icons'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'icons', 'x.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    fs.writeFileSync(path.join(tmpRoot, 'icon.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    fs.mkdirSync(path.join(tmpRoot, 'popup'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'popup', 'menu.html'), '<html></html>');
    fs.mkdirSync(path.join(tmpRoot, 'options'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'options', 'page.html'), '<html></html>');
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  test('resolves manifest default_icon relative to extension root', () => {
    const dataUri = loadIcon(tmpRoot, 'icons/x.png');
    expect(dataUri).toMatch(/^data:image\/png;base64,/);
  });

  test('strips leading slash from icon path', () => {
    const dataUri = loadIcon(tmpRoot, '/icons/x.png');
    expect(dataUri).toMatch(/^data:image\/png;base64,/);
  });

  test('selects best size from object form of default_icon', () => {
    const dataUri = loadIcon(tmpRoot, { '16': 'icons/missing.png', '32': 'icons/x.png' });
    expect(dataUri).toMatch(/^data:image\/png;base64,/);
  });

  test('returns null for missing file at extension root', () => {
    expect(loadIcon(tmpRoot, 'icons/missing.png')).toBeNull();
  });

  test('returns null for undefined icon', () => {
    expect(loadIcon(tmpRoot, undefined)).toBeNull();
  });

  test('returns null for empty object form (no usable size)', () => {
    expect(loadIcon(tmpRoot, {})).toBeNull();
  });

  test('handles chrome-extension:// URL form by stripping scheme and hostname', () => {
    const dataUri = loadIcon(tmpRoot, 'chrome-extension://abc123/icons/x.png');
    expect(dataUri).toMatch(/^data:image\/png;base64,/);
  });

  describe('with callerUrl (runtime action.setIcon from popup/options)', () => {
    test('resolves ../icons/x.png relative to caller in popup/', () => {
      const callerUrl = 'chrome-extension://abc123/popup/menu.html';
      const dataUri = loadIcon(tmpRoot, '../icons/x.png', callerUrl);
      expect(dataUri).toMatch(/^data:image\/png;base64,/);
    });

    test('resolves subdir/icon.png relative to caller in nested popup/', () => {
      fs.mkdirSync(path.join(tmpRoot, 'popup', 'nested', 'sub'), { recursive: true });
      fs.writeFileSync(
        path.join(tmpRoot, 'popup', 'nested', 'sub', 'icon.png'),
        Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      );
      const callerUrl = 'chrome-extension://abc123/popup/nested/menu.html';
      const dataUri = loadIcon(tmpRoot, 'sub/icon.png', callerUrl);
      expect(dataUri).toMatch(/^data:image\/png;base64,/);
    });

    test('falls back to root when caller-relative candidate does not exist', () => {
      const callerUrl = 'chrome-extension://abc123/popup/menu.html';
      // 'icons/x.png' exists at root but also from popup perspective ('../icons/x.png').
      // 'nonexistent.png' exists at neither → should fall back to root, which fails.
      expect(loadIcon(tmpRoot, 'nonexistent.png', callerUrl)).toBeNull();
    });

    test('uses root when caller is at extension root (service worker)', () => {
      const callerUrl = 'chrome-extension://abc123/service-worker.js';
      const dataUri = loadIcon(tmpRoot, 'icons/x.png', callerUrl);
      expect(dataUri).toMatch(/^data:image\/png;base64,/);
    });

    test('uses root when caller is at extension root (popup.html directly)', () => {
      fs.writeFileSync(path.join(tmpRoot, 'popup.html'), '<html></html>');
      const callerUrl = 'chrome-extension://abc123/popup.html';
      const dataUri = loadIcon(tmpRoot, 'icon.png', callerUrl);
      expect(dataUri).toMatch(/^data:image\/png;base64,/);
    });

    test('ignores non-chrome-extension callerUrl', () => {
      const callerUrl = 'http://evil.com/popup/menu.html';
      // '../icons/x.png' relative to root → outside root → null
      expect(loadIcon(tmpRoot, '../icons/x.png', callerUrl)).toBeNull();
    });

    test('ignores malformed callerUrl', () => {
      const callerUrl = 'not a url at all';
      expect(loadIcon(tmpRoot, '../icons/x.png', callerUrl)).toBeNull();
    });

    test('rejects callerUrl with traversal segments (security)', () => {
      const callerUrl = 'chrome-extension://abc123/../escape/menu.html';
      // 'icons/x.png' exists at root; caller-relative resolution should be skipped
      // (resolveCallerBase returns null on traversal), so the path is resolved
      // from root and the file is found.
      const dataUri = loadIcon(tmpRoot, 'icons/x.png', callerUrl);
      expect(dataUri).toMatch(/^data:image\/png;base64,/);
    });

    test('still resolves absolute chrome-extension URL when callerUrl given', () => {
      const callerUrl = 'chrome-extension://abc123/popup/menu.html';
      const dataUri = loadIcon(tmpRoot, 'chrome-extension://abc123/icons/x.png', callerUrl);
      // URL pathname is "/icons/x.png" → iconRelativePath = "icons/x.png"
      // resolves from root → exists → ok.
      expect(dataUri).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('security', () => {
    test('blocks path that escapes extension root (no callerUrl)', () => {
      expect(loadIcon(tmpRoot, '../escape/x.png')).toBeNull();
    });

    test('blocks path that escapes via caller-relative resolution', () => {
      const callerUrl = 'chrome-extension://abc123/popup/menu.html';
      // From popup/, ../../etc/passwd → outside extension, must be rejected.
      expect(loadIcon(tmpRoot, '../../etc/passwd', callerUrl)).toBeNull();
    });

    test('blocks non-chrome-extension URL scheme', () => {
      expect(loadIcon(tmpRoot, 'http://evil.com/icon.png')).toBeNull();
    });
  });
});
