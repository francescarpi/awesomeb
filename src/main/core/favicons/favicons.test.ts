import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { nativeImage } from 'electron';
import { createHash } from 'crypto';
import { Favicons } from './favicons';
import { DEFAULT_FAVICON, FAVICON_DAYS_EXPIRATION } from './constants';
import { userDataPath } from '@/paths';
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
