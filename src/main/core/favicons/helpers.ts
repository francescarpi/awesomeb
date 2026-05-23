import { type NativeImage, WebContents, nativeImage, net } from 'electron';
import fs from 'fs';
import slugify from 'slugify';
import { faviconsPath } from '@/paths';
import path from 'path';
import { DEFAULT_FAVICON } from './constants';

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

    let imageBuffer: Buffer;

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      imageBuffer = Buffer.from(bytes);
    } else {
      imageBuffer = DEFAULT_FAVICON;
    }

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
  opts?: { format?: 'buffer' | 'data' | 'native' | 'native12'; dontCacheOnDisk?: boolean },
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
        case 'native12':
          return nativeImage.createFromBuffer(cachedImage).resize({ width: 12, height: 12 });
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
  _wc: WebContents,
  url: string,
  callback: (dataImage: string) => void,
) {
  const dataImage = await fetchFaviconUsingNet(url);
  callback(dataImage);
}

async function fetchFaviconUsingNet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    const chunks: Buffer[] = [];

    request.on('response', (response) => {
      const contentType = (response.headers['content-type'] as string) || 'image/png';

      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        resolve(`data:${contentType};base64,${base64}`);
      });

      response.on('error', reject);
    });

    request.on('error', reject);
    request.end();
  });
}
