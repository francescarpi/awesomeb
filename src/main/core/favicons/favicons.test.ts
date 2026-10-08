import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { dialog, nativeImage } from 'electron';
import log from 'electron-log';
import { createHash } from 'crypto';
import { Favicons } from './favicons';
import { DEFAULT_FAVICON, FAVICON_DAYS_EXPIRATION } from './constants';
import { userDataPath } from '@/paths';
import * as core from '@/core';
import type { TTabId } from '~/types';
import fs from 'fs';
import path from 'path';

function faviconsFilePath(): string {
  return path.join(userDataPath(), 'favicons.json');
}

function cleanFaviconsFile(): void {
  const filePath = faviconsFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('Favicons.makeUrlHash', () => {
  let favicons: Favicons;

  beforeEach(() => {
    cleanFaviconsFile();
    favicons = new Favicons();
  });

  afterEach(() => {
    cleanFaviconsFile();
  });

  test('returns a sha256 hex hash', () => {
    expect(favicons.makeUrlHash('https://www.foo.com')).toMatch(/^[a-f0-9]{64}$/);
  });

  test('strips hash fragment before hashing', () => {
    const withHash = favicons.makeUrlHash('https://www.foo.com#aaa?boo=1');
    const withoutHash = favicons.makeUrlHash('https://www.foo.com');
    expect(withHash).toBe(withoutHash);
  });

  test('treats bare host and host with trailing slash as the same', () => {
    expect(favicons.makeUrlHash('https://www.foo.com')).toBe(
      favicons.makeUrlHash('https://www.foo.com/'),
    );
  });

  test('lowercases scheme and host before hashing', () => {
    expect(favicons.makeUrlHash('HTTPS://WWW.Foo.com')).toBe(
      favicons.makeUrlHash('https://www.foo.com'),
    );
  });

  test('preserves path case (paths are case-sensitive)', () => {
    expect(favicons.makeUrlHash('https://www.foo.com/X')).not.toBe(
      favicons.makeUrlHash('https://www.foo.com/x'),
    );
  });

  test('strips default port for https before hashing', () => {
    expect(favicons.makeUrlHash('https://www.foo.com:443/path')).toBe(
      favicons.makeUrlHash('https://www.foo.com/path'),
    );
  });

  test('strips default port for http before hashing', () => {
    expect(favicons.makeUrlHash('http://www.foo.com:80/path')).toBe(
      favicons.makeUrlHash('http://www.foo.com/path'),
    );
  });

  test('preserves non-default port', () => {
    expect(favicons.makeUrlHash('https://www.foo.com:8080/path')).not.toBe(
      favicons.makeUrlHash('https://www.foo.com/path'),
    );
  });

  test('collapses dot-segments in path', () => {
    expect(favicons.makeUrlHash('https://www.foo.com/a/./b/../c')).toBe(
      favicons.makeUrlHash('https://www.foo.com/a/c'),
    );
  });

  test('preserves query string when fragment is stripped', () => {
    expect(favicons.makeUrlHash('https://www.foo.com?utm_source=x#frag')).toBe(
      favicons.makeUrlHash('https://www.foo.com/?utm_source=x'),
    );
  });

  test('treats different query strings as different hashes', () => {
    expect(favicons.makeUrlHash('https://www.foo.com/?id=1')).not.toBe(
      favicons.makeUrlHash('https://www.foo.com/?id=2'),
    );
  });

  test('does not throw on invalid URL and still returns a hash', () => {
    expect(() => favicons.makeUrlHash('not-a-url')).not.toThrow();
    expect(favicons.makeUrlHash('not-a-url')).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('Favicons.getFaviconByUrl', () => {
  let favicons: Favicons;
  let createFromDataURLSpy: ReturnType<typeof vi.spyOn>;
  let createFromBufferSpy: ReturnType<typeof vi.spyOn>;

  function seed(url: string, faviconUrl: string, created = Date.now()): string {
    const urlHash = favicons.makeUrlHash(url);
    const faviconHash = createHash('sha256').update(faviconUrl).digest('hex');
    const imgData = `data:image/png;base64,XXXXX`;
    favicons.set(`favicons.${faviconHash}`, { created, imgData });
    favicons.set(`byUrl.${urlHash}`, faviconHash);
    return imgData;
  }

  beforeEach(() => {
    cleanFaviconsFile();
    favicons = new Favicons();
    createFromDataURLSpy = vi.spyOn(nativeImage, 'createFromDataURL');
    createFromBufferSpy = vi.spyOn(nativeImage, 'createFromBuffer');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanFaviconsFile();
  });

  test('uses createFromDataURL with the stored imgData on hit', () => {
    const imgData = seed('https://example.com', 'https://example.com/favicon.ico');
    favicons.getFaviconByUrl('https://example.com');
    expect(createFromDataURLSpy).toHaveBeenCalledWith(imgData);
    expect(createFromBufferSpy).not.toHaveBeenCalled();
  });

  test('falls back to createFromBuffer with DEFAULT_FAVICON when URL has no entry', () => {
    favicons.getFaviconByUrl('https://unknown.com');
    expect(createFromBufferSpy).toHaveBeenCalledWith(DEFAULT_FAVICON);
    expect(createFromDataURLSpy).not.toHaveBeenCalled();
  });

  test('falls back when favicon is expired', () => {
    seed(
      'https://example.com',
      'https://example.com/favicon.ico',
      Date.now() - FAVICON_DAYS_EXPIRATION - 1,
    );
    favicons.getFaviconByUrl('https://example.com');
    expect(createFromBufferSpy).toHaveBeenCalledWith(DEFAULT_FAVICON);
    expect(createFromDataURLSpy).not.toHaveBeenCalled();
  });

  test('falls back when byUrl points to a non-existent favicon hash', () => {
    const urlHash = favicons.makeUrlHash('https://example.com');
    favicons.set(`byUrl.${urlHash}`, 'this-hash-does-not-exist');
    favicons.getFaviconByUrl('https://example.com');
    expect(createFromBufferSpy).toHaveBeenCalledWith(DEFAULT_FAVICON);
  });

  test('matches the entry even when caller URL has a fragment', () => {
    const imgData = seed('https://example.com', 'https://example.com/favicon.ico');
    favicons.getFaviconByUrl('https://example.com#section');
    expect(createFromDataURLSpy).toHaveBeenCalledWith(imgData);
  });

  test('resizes to 12 by default', () => {
    const fakeImage = { resize: vi.fn().mockReturnThis() };
    createFromBufferSpy.mockReturnValue(fakeImage as never);

    favicons.getFaviconByUrl('https://unknown.com');

    expect(fakeImage.resize).toHaveBeenCalledWith({ width: 12, height: 12 });
  });

  test('uses the size option when provided', () => {
    const fakeImage = { resize: vi.fn().mockReturnThis() };
    createFromBufferSpy.mockReturnValue(fakeImage as never);

    favicons.getFaviconByUrl('https://unknown.com', { size: 24 });

    expect(fakeImage.resize).toHaveBeenCalledWith({ width: 24, height: 24 });
  });
});

describe('Favicons.parseFavicon', () => {
  const FAKE_FETCH_RESULT = 'data:image/png;base64,FAKE_PAYLOAD';

  let favicons: Favicons;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cleanFaviconsFile();
    favicons = new Favicons();
    fetchSpy = vi.spyOn(core, 'fetchFaviconUsingNet').mockResolvedValue(FAKE_FETCH_RESULT);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanFaviconsFile();
  });

  test('initializes with empty store', () => {
    expect(favicons.store).toEqual({ favicons: {}, byTab: {}, byUrl: {} });
  });

  test('cache miss: fetches, persists, and returns the fetched data', async () => {
    const tabId: TTabId = 1;
    const faviconUrl = 'https://example.com/favicon.ico';
    const tabUrl = 'https://example.com/page';
    const faviconHash = createHash('sha256').update(faviconUrl).digest('hex');
    const urlHash = favicons.makeUrlHash(tabUrl);

    const result = await favicons.parseFavicon(tabId, faviconUrl, tabUrl);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(faviconUrl);
    expect(result).toBe(FAKE_FETCH_RESULT);

    const stored = favicons.get(`favicons.${faviconHash}`) as { created: number; imgData: string };
    expect(stored.imgData).toBe(FAKE_FETCH_RESULT);
    expect(stored.created).toBeGreaterThan(Date.now() - 5000);

    const byTab = favicons.get(`byTab.${tabId}`) as { latest: string; favicons: string[] };
    expect(byTab.latest).toBe(faviconHash);
    expect(byTab.favicons).toEqual([faviconHash]);

    expect(favicons.get(`byUrl.${urlHash}`)).toBe(faviconHash);
  });

  test('cache hit (not expired): does not fetch and returns the cached imgData', async () => {
    const tabId: TTabId = 2;
    const faviconUrl = 'https://example.com/favicon.ico';
    const tabUrl = 'https://example.com/page';
    const faviconHash = createHash('sha256').update(faviconUrl).digest('hex');
    const cached = 'data:image/png;base64,CACHED';
    favicons.set(`favicons.${faviconHash}`, { created: Date.now(), imgData: cached });

    const result = await favicons.parseFavicon(tabId, faviconUrl, tabUrl);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toBe(cached);
  });

  test('cache hit but expired: refetches and updates the entry', async () => {
    const tabId: TTabId = 3;
    const faviconUrl = 'https://example.com/favicon.ico';
    const tabUrl = 'https://example.com/page';
    const faviconHash = createHash('sha256').update(faviconUrl).digest('hex');
    const expiredCreated = Date.now() - FAVICON_DAYS_EXPIRATION - 1000;
    favicons.set(`favicons.${faviconHash}`, {
      created: expiredCreated,
      imgData: 'data:image/png;base64,STALE',
    });

    const result = await favicons.parseFavicon(tabId, faviconUrl, tabUrl);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(FAKE_FETCH_RESULT);

    const stored = favicons.get(`favicons.${faviconHash}`) as { created: number; imgData: string };
    expect(stored.imgData).toBe(FAKE_FETCH_RESULT);
    expect(stored.created).toBeGreaterThan(expiredCreated);
  });

  test('fetch rejects: returns null and does not persist anything', async () => {
    fetchSpy.mockRejectedValue(undefined);
    const tabId: TTabId = 4;
    const faviconUrl = 'https://broken.example.com/favicon.ico';
    const tabUrl = 'https://broken.example.com/';

    const result = await favicons.parseFavicon(tabId, faviconUrl, tabUrl);

    expect(result).toBeNull();
    expect(favicons.store).toEqual({ favicons: {}, byTab: {}, byUrl: {} });
  });

  test('multiple favicons for the same tab: appends to the favicons array and updates latest', async () => {
    const tabId: TTabId = 5;
    const tabUrl = 'https://example.com/';

    const first = await favicons.parseFavicon(tabId, 'https://example.com/a.ico', tabUrl);
    fetchSpy.mockResolvedValueOnce('data:image/png;base64,SECOND');
    const second = await favicons.parseFavicon(tabId, 'https://example.com/b.ico', tabUrl);

    expect(first).toBe(FAKE_FETCH_RESULT);
    expect(second).toBe('data:image/png;base64,SECOND');

    const byTab = favicons.get(`byTab.${tabId}`) as { latest: string; favicons: string[] };
    expect(byTab.favicons).toHaveLength(2);
    expect(byTab.latest).toBe(
      createHash('sha256').update('https://example.com/b.ico').digest('hex'),
    );
    expect(byTab.favicons[0]).toBe(
      createHash('sha256').update('https://example.com/a.ico').digest('hex'),
    );
  });

  test('byUrl already populated: does not overwrite the existing hash', async () => {
    const tabId: TTabId = 6;
    const tabUrl = 'https://example.com/';
    const urlHash = favicons.makeUrlHash(tabUrl);
    const existingHash = createHash('sha256').update('https://existing.ico').digest('hex');
    favicons.set(`byUrl.${urlHash}`, existingHash);

    await favicons.parseFavicon(tabId, 'https://example.com/new.ico', tabUrl);

    expect(favicons.get(`byUrl.${urlHash}`)).toBe(existingHash);
  });

  test('uses normalized tabUrl for the byUrl key (strips fragment)', async () => {
    const tabId: TTabId = 7;
    const tabUrl = 'https://example.com/page#section';
    const urlHash = favicons.makeUrlHash(tabUrl);

    await favicons.parseFavicon(tabId, 'https://example.com/favicon.ico', tabUrl);

    const storedHash = favicons.get(`byUrl.${urlHash}`);
    expect(storedHash).toBe(
      createHash('sha256').update('https://example.com/favicon.ico').digest('hex'),
    );
  });
});

describe('Favicons.getLastTabFavicon', () => {
  let favicons: Favicons;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cleanFaviconsFile();
    favicons = new Favicons();
    errorSpy = vi.spyOn(log.scope('Favicons'), 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanFaviconsFile();
  });

  test('returns the imgData referenced by byTab.<id>.latest', () => {
    const tabId: TTabId = 1;
    const faviconHash = createHash('sha256')
      .update('https://example.com/favicon.ico')
      .digest('hex');
    const imgData = 'data:image/png;base64,VALID';
    favicons.set(`favicons.${faviconHash}`, { created: Date.now(), imgData });
    favicons.set(`byTab.${tabId}`, { latest: faviconHash, favicons: [faviconHash] });

    expect(favicons.getLastTabFavicon(tabId)).toBe(imgData);
  });

  test('returns null when byTab has no latest entry', () => {
    expect(favicons.getLastTabFavicon(999 as TTabId)).toBeNull();
  });

  test('returns null and logs error when latest hash points to a missing favicon', () => {
    const tabId: TTabId = 42;
    favicons.set(`byTab.${tabId}`, { latest: 'orphan-hash', favicons: ['orphan-hash'] });

    expect(favicons.getLastTabFavicon(tabId)).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Favicons.deleteFavicon', () => {
  let favicons: Favicons;

  beforeEach(() => {
    cleanFaviconsFile();
    favicons = new Favicons();
  });

  afterEach(() => {
    cleanFaviconsFile();
  });

  test('removes only byTab.<tabId> and leaves favicons/byUrl intact', () => {
    const tabId: TTabId = 1;
    const faviconHash = createHash('sha256')
      .update('https://example.com/favicon.ico')
      .digest('hex');
    const urlHash = favicons.makeUrlHash('https://example.com/page');
    favicons.set(`favicons.${faviconHash}`, {
      created: Date.now(),
      imgData: 'data:image/png;base64,X',
    });
    favicons.set(`byTab.${tabId}`, { latest: faviconHash, favicons: [faviconHash] });
    favicons.set(`byUrl.${urlHash}`, faviconHash);

    favicons.deleteFavicon(tabId);

    expect(favicons.get(`byTab.${tabId}`)).toBeUndefined();
    expect(favicons.get(`byUrl.${urlHash}`)).toBe(faviconHash);
    expect(favicons.get(`favicons.${faviconHash}`)).toBeDefined();
  });

  test('does not throw when called for a non-existent tabId', () => {
    expect(() => favicons.deleteFavicon(999 as TTabId)).not.toThrow();
    expect(favicons.store).toEqual({ favicons: {}, byTab: {}, byUrl: {} });
  });
});

describe('Favicons constructor / favicons.json corruption', () => {
  let dialogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cleanFaviconsFile();
    dialogSpy = vi.spyOn(dialog, 'showErrorBox').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanFaviconsFile();
  });

  function writeRaw(content: string): void {
    fs.writeFileSync(faviconsFilePath(), content, 'utf-8');
  }

  test('loads existing valid data from favicons.json', () => {
    const stored = {
      favicons: { abc: { created: 1, imgData: 'data:png,X' } },
      byTab: { 'tab-1': { latest: 'abc', favicons: ['abc'] } },
      byUrl: { urlHash: 'abc' },
    };
    writeRaw(JSON.stringify(stored));

    const favicons = new Favicons();

    expect(favicons.get('favicons.abc')).toEqual({ created: 1, imgData: 'data:png,X' });
    expect(favicons.get('byTab.tab-1')).toEqual({ latest: 'abc', favicons: ['abc'] });
    expect(dialogSpy).not.toHaveBeenCalled();
  });

  test('falls back to defaults when favicons.json is not valid JSON', () => {
    writeRaw('{ this is not json');

    const favicons = new Favicons();

    // electron-store's `clearInvalidConfig: true` merges the constructor
    // `defaults` over the empty result of a failed JSON parse, so we end up
    // with the default store. No dialog is raised for this specific case
    // because the recovery happens before Zod ever sees the data.
    expect(favicons.store).toEqual({ favicons: {}, byTab: {}, byUrl: {} });
    expect(dialogSpy).not.toHaveBeenCalled();
  });

  test('falls back to defaults when JSON has extra fields (strict mode)', () => {
    writeRaw(JSON.stringify({ favicons: {}, byTab: {}, byUrl: {}, extra: 'not-allowed' }));

    const favicons = new Favicons();

    expect(favicons.store).toEqual({ favicons: {}, byTab: {}, byUrl: {} });
    expect(dialogSpy).toHaveBeenCalledTimes(1);
  });
});
