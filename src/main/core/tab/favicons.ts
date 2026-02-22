import { type NativeImage, WebContents, nativeImage } from 'electron';
import fs from 'fs';
import slugify from 'slugify';
import { faviconsPath } from '@/paths';
import path from 'path';

import log from 'electron-log';
const scopeLog = log.scope('FaviconsHelper');

const MEMORY_CACHE: Map<string, Buffer> = new Map();

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch {
    scopeLog.warn(`Invalid URL: ${url}`);
    return 'http://localhost';
  }
}

function gennerateCacheKey(url: string): string {
  const slug = slugify(url, { lower: true, strict: true });
  return slug;
}

function getCachedFaviconFromMemory(url: string, _dontCacheOnDisk?: boolean): Buffer | null {
  const cacheKey = gennerateCacheKey(url);
  return MEMORY_CACHE.get(cacheKey) || null;
}

function getCachedFaviconFromDisk(url: string, _dontCacheOnDisk?: boolean): Buffer | null {
  const folder = faviconsPath();
  const cacheKey = gennerateCacheKey(url);
  const filePath = path.join(folder, `${cacheKey}.png`);

  if (fs.existsSync(filePath)) {
    try {
      const imageBuffer = fs.readFileSync(filePath);

      // Cache in memory for faster access next time
      MEMORY_CACHE.set(cacheKey, imageBuffer);

      return imageBuffer;
    } catch (err) {
      scopeLog.error(`Error reading favicon file at ${filePath}`, err);
      return null;
    }
  }

  return null;
}

async function fetchFromUrlAndCache(
  url: string,
  dontCacheOnDisk?: boolean,
): Promise<Buffer | null> {
  const source = `https://www.google.com/s2/favicons?domain=${url}&sz=32`;
  try {
    const response = await fetch(source);
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const imageBuffer = Buffer.from(bytes);

    // Cache in memory
    const cacheKey = gennerateCacheKey(url);
    MEMORY_CACHE.set(cacheKey, imageBuffer);

    // Cache on disk
    if (!dontCacheOnDisk) {
      const folder = faviconsPath();
      const filePath = path.join(folder, `${cacheKey}.png`);
      fs.writeFile(filePath, imageBuffer, (err) => {
        if (err) {
          scopeLog.error(`Error writing favicon file at ${filePath}`, err);
        }
      });
    }

    return imageBuffer;
  } catch (err) {
    scopeLog.error(`Error fetching favicon from ${source}`, err);
  }

  return null;
}

export async function getCachedFavicon(
  url: string,
  opts?: { format?: 'buffer' | 'data' | 'native' | 'native16'; dontCacheOnDisk?: boolean },
): Promise<string | Buffer | NativeImage | null> {
  const normalized = normalizeUrl(url);
  const { format, dontCacheOnDisk } = opts || {};

  for (const fetcher of [
    getCachedFaviconFromMemory,
    getCachedFaviconFromDisk,
    fetchFromUrlAndCache,
  ]) {
    const cachedImage = await fetcher(normalized, dontCacheOnDisk);
    if (cachedImage) {
      switch (format || 'data') {
        case 'native':
          return nativeImage.createFromBuffer(cachedImage);
        case 'native16':
          return nativeImage.createFromBuffer(cachedImage).resize({ width: 16, height: 16 });
        case 'buffer':
          return cachedImage;
        case 'data':
          return `data:image/png;base64,${cachedImage.toString('base64')}`;
      }
    }
  }

  return null;
}

export async function parseFavicon(
  wc: WebContents,
  url: string,
  callback: (dataImage: string) => void,
) {
  const dataImage = await fetchFavicon(wc, url);
  callback(dataImage);
}

async function fetchFavicon(wc: WebContents, url: string): Promise<string> {
  const { base64, type } = await wc.executeJavaScript(`
    (async () => {
      const response = await fetch('${url}');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return { base64: btoa(binary), type: blob.type };
    })()
  `);

  return `data:${type};base64,${base64}`;
}
