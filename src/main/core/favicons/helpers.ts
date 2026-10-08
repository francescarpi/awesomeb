import { net } from 'electron';
import sharp, { type Raw } from 'sharp';
import decodeIco from 'decode-ico';
import log from 'electron-log';
import { ICO_MIME_TYPES, NORMALIZED_SIZE } from './constants';

const scopeLog = log.scope('FaviconsHelpers');

export function bufferToDataUrl(contentType: string, buffer: Buffer): string {
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

function pickLargestImage<T extends { width: number; height: number }>(images: T[]): T {
  let best = images[0];
  let bestArea = best.width * best.height;
  for (const img of images) {
    const area = img.width * img.height;
    if (area > bestArea) {
      best = img;
      bestArea = area;
    }
  }
  return best;
}

const RESIZE_OPTIONS = {
  fit: 'contain' as const,
  background: { r: 0, g: 0, b: 0, alpha: 0 },
};

async function rasterizeToPng(buffer: Buffer, raw?: Raw): Promise<string> {
  const png = await sharp(buffer, raw ? { raw } : undefined)
    .resize(NORMALIZED_SIZE, NORMALIZED_SIZE, RESIZE_OPTIONS)
    .png()
    .toBuffer();
  return bufferToDataUrl('image/png', png);
}

async function decodeIcoToPng(buffer: Buffer): Promise<string> {
  const images = decodeIco(buffer);
  if (!images.length) {
    throw new Error('ICO contains no images');
  }

  const largest = pickLargestImage(images);
  const data = Buffer.from(largest.data);

  if (largest.type === 'png') {
    return rasterizeToPng(data);
  }

  return rasterizeToPng(data, {
    width: largest.width,
    height: largest.height,
    channels: 4,
  });
}

export async function normalizeToPng(contentType: string, buffer: Buffer): Promise<string> {
  if (ICO_MIME_TYPES.has(contentType)) {
    return decodeIcoToPng(buffer);
  }
  return rasterizeToPng(buffer);
}

export async function fetchFaviconUsingNet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    const chunks: Buffer[] = [];

    request.on('response', (response) => {
      const contentType = (response.headers['content-type'] as string) || 'image/png';

      if (['text/html'].includes(contentType)) {
        reject();
        return;
      }

      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const dataUrl = await normalizeToPng(contentType, buffer);
          resolve(dataUrl);
        } catch (err) {
          scopeLog.warn(`Failed to normalize favicon from ${url}:`, err);
          reject();
        }
      });

      response.on('error', reject);
    });

    request.on('error', reject);
    request.end();
  });
}
