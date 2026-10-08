import { describe, expect, test, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { net } from 'electron';
import { bufferToDataUrl, normalizeToPng, fetchFaviconUsingNet } from './helpers';

interface IcoImage {
  width: number;
  height: number;
  type: 'bmp' | 'png';
  bpp: number;
  data: Uint8Array;
  hotspot: null | { x: number; y: number };
}

interface ResizeArgs {
  width: number;
  height: number;
  options: { fit: string; background: { r: number; g: number; b: number; alpha: number } };
}

const sharpMockState = vi.hoisted(() => ({
  toBufferResult: Buffer.from([0xaa, 0xbb, 0xcc]),
  pngCalled: 0,
  toBufferCalls: 0,
  resizeCalls: 0,
  sharpCalls: 0,
  lastRawInput: null as { width: number; height: number; channels: number } | null,
  lastResizeArgs: null as ResizeArgs | null,
  lastInputWasRaw: false,
  shouldThrow: false,
}));

const decodeIcoMockState = vi.hoisted(() => ({
  callCount: 0,
  images: [] as IcoImage[],
  shouldThrow: false,
}));

vi.mock('sharp', () => {
  const chain = {
    resize: (width: number, height: number, options: ResizeArgs['options']): typeof chain => {
      sharpMockState.resizeCalls += 1;
      sharpMockState.lastResizeArgs = { width, height, options };
      return chain;
    },
    png: () => {
      sharpMockState.pngCalled += 1;
      return chain;
    },
    toBuffer: async () => {
      sharpMockState.toBufferCalls += 1;
      if (sharpMockState.shouldThrow) {
        throw new Error('sharp failed');
      }
      return sharpMockState.toBufferResult;
    },
  };
  const sharp = (
    input?: Uint8Array,
    options?: { raw?: { width: number; height: number; channels: number } },
  ): unknown => {
    sharpMockState.sharpCalls += 1;
    if (options?.raw) {
      sharpMockState.lastRawInput = options.raw;
      sharpMockState.lastInputWasRaw = true;
      expect(input).toBeDefined();
    } else {
      sharpMockState.lastInputWasRaw = false;
    }
    return chain;
  };
  return { default: sharp };
});

vi.mock('decode-ico', () => ({
  default: (_buffer: Buffer): IcoImage[] => {
    decodeIcoMockState.callCount += 1;
    if (decodeIcoMockState.shouldThrow) {
      throw new Error('decode-ico failed');
    }
    return decodeIcoMockState.images;
  },
}));

interface FakeResponse extends EventEmitter {
  headers: Record<string, string>;
}

function makeFakeResponse(headers: Record<string, string>): FakeResponse {
  const emitter = new EventEmitter() as FakeResponse;
  emitter.headers = headers;
  return emitter;
}

function makeFakeRequest(
  response: FakeResponse,
): EventEmitter & { write: () => void; abort: () => void; end: () => void } {
  const emitter = new EventEmitter() as EventEmitter & {
    write: () => void;
    abort: () => void;
    end: () => void;
  };
  emitter.write = (): void => {};
  emitter.abort = (): void => {};
  emitter.end = (): void => {
    emitter.emit('response', response);
  };
  return emitter;
}

function bmpImage(width: number, height: number, bpp = 32): IcoImage {
  const size = width * height * 4;
  return {
    width,
    height,
    type: 'bmp',
    bpp,
    data: new Uint8Array(size),
    hotspot: null,
  };
}

function pngImage(
  width: number,
  height: number,
  bytes: number[] = [0x89, 0x50, 0x4e, 0x47],
): IcoImage {
  return {
    width,
    height,
    type: 'png',
    bpp: 32,
    data: new Uint8Array(bytes),
    hotspot: null,
  };
}

function expectContainWithTransparentBg(): void {
  expect(sharpMockState.lastResizeArgs?.options.fit).toBe('contain');
  expect(sharpMockState.lastResizeArgs?.options.background).toEqual({
    r: 0,
    g: 0,
    b: 0,
    alpha: 0,
  });
}

function expectNormalizedToPng(url: string): void {
  expect(url.startsWith('data:image/png;base64,')).toBe(true);
  expect(url).toBe(`data:image/png;base64,${sharpMockState.toBufferResult.toString('base64')}`);
}

describe('normalizeToPng', () => {
  beforeEach(() => {
    sharpMockState.pngCalled = 0;
    sharpMockState.toBufferCalls = 0;
    sharpMockState.resizeCalls = 0;
    sharpMockState.sharpCalls = 0;
    sharpMockState.lastRawInput = null;
    sharpMockState.lastResizeArgs = null;
    sharpMockState.lastInputWasRaw = false;
    sharpMockState.shouldThrow = false;
    sharpMockState.toBufferResult = Buffer.from([0xaa, 0xbb, 0xcc]);
    decodeIcoMockState.callCount = 0;
    decodeIcoMockState.images = [];
    decodeIcoMockState.shouldThrow = false;
  });

  describe('ICO path', () => {
    test('decodes BMP-encoded ICO entries via raw sharp call', async () => {
      decodeIcoMockState.images = [bmpImage(16, 16, 24)];

      const url = await normalizeToPng('image/x-icon', Buffer.from([0x00]));

      expect(decodeIcoMockState.callCount).toBe(1);
      expect(sharpMockState.lastInputWasRaw).toBe(true);
      expect(sharpMockState.lastRawInput).toEqual({ width: 16, height: 16, channels: 4 });
      expect(sharpMockState.resizeCalls).toBe(1);
      expect(sharpMockState.lastResizeArgs?.width).toBe(32);
      expect(sharpMockState.lastResizeArgs?.height).toBe(32);
      expect(sharpMockState.pngCalled).toBe(1);
      expectNormalizedToPng(url);
    });

    test('decodes image/vnd.microsoft.icon via decode-ico', async () => {
      decodeIcoMockState.images = [bmpImage(32, 32)];
      await normalizeToPng('image/vnd.microsoft.icon', Buffer.from([0x01]));
      expect(decodeIcoMockState.callCount).toBe(1);
    });

    test('decodes image/ico via decode-ico', async () => {
      decodeIcoMockState.images = [bmpImage(32, 32)];
      await normalizeToPng('image/ico', Buffer.from([0x01]));
      expect(decodeIcoMockState.callCount).toBe(1);
    });

    test('decodes PNG-encoded ICO entries via auto-detect sharp call', async () => {
      const pngEntry = pngImage(64, 64);
      decodeIcoMockState.images = [pngEntry];

      const url = await normalizeToPng('image/x-icon', Buffer.from([0x00]));

      expect(decodeIcoMockState.callCount).toBe(1);
      expect(sharpMockState.lastInputWasRaw).toBe(false);
      expect(sharpMockState.resizeCalls).toBe(1);
      expectNormalizedToPng(url);
    });

    test('picks the largest ICO entry by pixel count', async () => {
      decodeIcoMockState.images = [bmpImage(16, 16), bmpImage(64, 64), bmpImage(32, 32)];

      await normalizeToPng('image/x-icon', Buffer.from([0x00]));

      expect(sharpMockState.lastRawInput).toEqual({ width: 64, height: 64, channels: 4 });
    });

    test('uses contain fit with transparent background to avoid upscaling', async () => {
      decodeIcoMockState.images = [bmpImage(16, 16)];

      await normalizeToPng('image/x-icon', Buffer.from([0x00]));

      expectContainWithTransparentBg();
    });

    test('resizes to 32x32 regardless of source dimensions', async () => {
      decodeIcoMockState.images = [bmpImage(256, 256)];

      await normalizeToPng('image/x-icon', Buffer.from([0x00]));

      expect(sharpMockState.lastResizeArgs?.width).toBe(32);
      expect(sharpMockState.lastResizeArgs?.height).toBe(32);
    });

    test('rejects when ICO contains no images', async () => {
      decodeIcoMockState.images = [];
      await expect(normalizeToPng('image/x-icon', Buffer.from([0x00]))).rejects.toThrow(
        'ICO contains no images',
      );
    });

    test('rejects when decode-ico throws on malformed ICO', async () => {
      decodeIcoMockState.shouldThrow = true;
      await expect(normalizeToPng('image/x-icon', Buffer.from([0x00]))).rejects.toThrow(
        'decode-ico failed',
      );
    });

    test('rejects when sharp throws during BMP → PNG encoding', async () => {
      decodeIcoMockState.images = [bmpImage(16, 16)];
      sharpMockState.shouldThrow = true;
      await expect(normalizeToPng('image/x-icon', Buffer.from([0x00]))).rejects.toThrow(
        'sharp failed',
      );
    });
  });

  describe('non-ICO rasterization path', () => {
    test('rasterizes PNG to 32x32 via sharp', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const url = await normalizeToPng('image/png', pngBuffer);

      expect(decodeIcoMockState.callCount).toBe(0);
      expect(sharpMockState.sharpCalls).toBe(1);
      expect(sharpMockState.lastInputWasRaw).toBe(false);
      expect(sharpMockState.resizeCalls).toBe(1);
      expect(sharpMockState.lastResizeArgs?.width).toBe(32);
      expect(sharpMockState.lastResizeArgs?.height).toBe(32);
      expectContainWithTransparentBg();
      expectNormalizedToPng(url);
    });

    test('rasterizes SVG to 32x32 via sharp and outputs PNG', async () => {
      const svgBuffer = Buffer.from('<svg></svg>');
      const url = await normalizeToPng('image/svg+xml', svgBuffer);

      expect(decodeIcoMockState.callCount).toBe(0);
      expect(sharpMockState.sharpCalls).toBe(1);
      expect(sharpMockState.resizeCalls).toBe(1);
      expectNormalizedToPng(url);
    });

    test('rasterizes JPEG to 32x32 via sharp and outputs PNG', async () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const url = await normalizeToPng('image/jpeg', jpegBuffer);

      expect(decodeIcoMockState.callCount).toBe(0);
      expect(sharpMockState.sharpCalls).toBe(1);
      expect(sharpMockState.resizeCalls).toBe(1);
      expectNormalizedToPng(url);
    });

    test('rasterizes GIF to 32x32 via sharp and outputs PNG', async () => {
      const gifBuffer = Buffer.from('GIF89a', 'ascii');
      const url = await normalizeToPng('image/gif', gifBuffer);

      expect(decodeIcoMockState.callCount).toBe(0);
      expect(sharpMockState.sharpCalls).toBe(1);
      expectNormalizedToPng(url);
    });

    test('rasterizes WebP to 32x32 via sharp and outputs PNG', async () => {
      const webpBuffer = Buffer.from('RIFF', 'ascii');
      const url = await normalizeToPng('image/webp', webpBuffer);

      expect(decodeIcoMockState.callCount).toBe(0);
      expect(sharpMockState.sharpCalls).toBe(1);
      expectNormalizedToPng(url);
    });

    test('rejects when sharp throws on non-ICO input', async () => {
      sharpMockState.shouldThrow = true;
      await expect(normalizeToPng('image/png', Buffer.from([0x00]))).rejects.toThrow(
        'sharp failed',
      );
    });
  });
});

describe('fetchFaviconUsingNet', () => {
  beforeEach(() => {
    sharpMockState.pngCalled = 0;
    sharpMockState.toBufferCalls = 0;
    sharpMockState.resizeCalls = 0;
    sharpMockState.sharpCalls = 0;
    sharpMockState.lastRawInput = null;
    sharpMockState.lastResizeArgs = null;
    sharpMockState.lastInputWasRaw = false;
    sharpMockState.shouldThrow = false;
    sharpMockState.toBufferResult = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
    decodeIcoMockState.callCount = 0;
    decodeIcoMockState.images = [];
    decodeIcoMockState.shouldThrow = false;
  });

  test('converts ICO response into 32x32 PNG via decode-ico + sharp', async () => {
    decodeIcoMockState.images = [bmpImage(32, 32)];

    const fakeResponse = makeFakeResponse({ 'content-type': 'image/x-icon' });
    const fakeRequest = makeFakeRequest(fakeResponse);
    const spy = vi.spyOn(net, 'request').mockReturnValue(fakeRequest as never);

    const promise = fetchFaviconUsingNet('https://example.com/favicon.ico');

    fakeResponse.emit('data', Buffer.from([0x00, 0x00, 0x01, 0x00]));
    fakeResponse.emit('end');

    const url = await promise;
    expect(spy).toHaveBeenCalledWith('https://example.com/favicon.ico');
    expect(decodeIcoMockState.callCount).toBe(1);
    expect(sharpMockState.resizeCalls).toBe(1);
    expect(sharpMockState.lastResizeArgs?.width).toBe(32);
    expectNormalizedToPng(url);
  });

  test('rasterizes PNG response into 32x32 PNG via sharp', async () => {
    const pngBody = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const fakeResponse = makeFakeResponse({ 'content-type': 'image/png' });
    const fakeRequest = makeFakeRequest(fakeResponse);
    vi.spyOn(net, 'request').mockReturnValue(fakeRequest as never);

    const promise = fetchFaviconUsingNet('https://example.com/favicon.png');

    fakeResponse.emit('data', pngBody);
    fakeResponse.emit('end');

    const url = await promise;
    expect(decodeIcoMockState.callCount).toBe(0);
    expect(sharpMockState.sharpCalls).toBe(1);
    expect(sharpMockState.resizeCalls).toBe(1);
    expectNormalizedToPng(url);
  });

  test('rasterizes SVG response into 32x32 PNG via sharp', async () => {
    const svgBody = Buffer.from('<svg></svg>');
    const fakeResponse = makeFakeResponse({ 'content-type': 'image/svg+xml' });
    const fakeRequest = makeFakeRequest(fakeResponse);
    vi.spyOn(net, 'request').mockReturnValue(fakeRequest as never);

    const promise = fetchFaviconUsingNet('https://example.com/icon.svg');

    fakeResponse.emit('data', svgBody);
    fakeResponse.emit('end');

    const url = await promise;
    expect(decodeIcoMockState.callCount).toBe(0);
    expect(sharpMockState.sharpCalls).toBe(1);
    expect(sharpMockState.resizeCalls).toBe(1);
    expectNormalizedToPng(url);
  });

  test('rejects on text/html content without invoking conversion', async () => {
    const fakeResponse = makeFakeResponse({ 'content-type': 'text/html' });
    const fakeRequest = makeFakeRequest(fakeResponse);
    vi.spyOn(net, 'request').mockReturnValue(fakeRequest as never);

    await expect(fetchFaviconUsingNet('https://example.com')).rejects.toBeUndefined();
    expect(decodeIcoMockState.callCount).toBe(0);
    expect(sharpMockState.sharpCalls).toBe(0);
  });

  test('rejects when decode-ico throws during normalization', async () => {
    decodeIcoMockState.shouldThrow = true;

    const fakeResponse = makeFakeResponse({ 'content-type': 'image/x-icon' });
    const fakeRequest = makeFakeRequest(fakeResponse);
    vi.spyOn(net, 'request').mockReturnValue(fakeRequest as never);

    const promise = fetchFaviconUsingNet('https://example.com/favicon.ico');

    fakeResponse.emit('data', Buffer.from([0x00]));
    fakeResponse.emit('end');

    await expect(promise).rejects.toBeUndefined();
  });

  test('rejects when sharp throws during normalization', async () => {
    decodeIcoMockState.images = [bmpImage(16, 16)];
    sharpMockState.shouldThrow = true;

    const fakeResponse = makeFakeResponse({ 'content-type': 'image/x-icon' });
    const fakeRequest = makeFakeRequest(fakeResponse);
    vi.spyOn(net, 'request').mockReturnValue(fakeRequest as never);

    const promise = fetchFaviconUsingNet('https://example.com/favicon.ico');

    fakeResponse.emit('data', Buffer.from([0x00]));
    fakeResponse.emit('end');

    await expect(promise).rejects.toBeUndefined();
  });

  test('rasterizes response when content-type header is missing', async () => {
    const pngBody = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const fakeResponse = makeFakeResponse({});
    const fakeRequest = makeFakeRequest(fakeResponse);
    vi.spyOn(net, 'request').mockReturnValue(fakeRequest as never);

    const promise = fetchFaviconUsingNet('https://example.com/icon');

    fakeResponse.emit('data', pngBody);
    fakeResponse.emit('end');

    const url = await promise;
    expect(sharpMockState.sharpCalls).toBe(1);
    expectNormalizedToPng(url);
  });
});

describe('bufferToDataUrl', () => {
  test('generates the correct data URL for a PNG buffer', () => {
    const buffer = Buffer.from([0xaa, 0xbb]);
    const url = bufferToDataUrl('image/png', buffer);
    expect(url).toBe(`data:image/png;base64,${buffer.toString('base64')}`);
  });

  test('uses the provided content type verbatim in the prefix', () => {
    const buffer = Buffer.from('<svg></svg>');
    const url = bufferToDataUrl('image/svg+xml', buffer);
    expect(url.startsWith('data:image/svg+xml;base64,')).toBe(true);
    expect(url).toBe(`data:image/svg+xml;base64,${buffer.toString('base64')}`);
  });
});
