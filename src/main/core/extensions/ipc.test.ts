import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { Browser } from '@/core';
import { setupExtensionsIPC, setupExtensionsServiceWorkerIPC } from './ipc';
import { RUNTIME_SEND_MESSAGE_CHANNEL, RUNTIME_SEND_RESPONSE_CHANNEL } from './runtime-bus';

type InvokeHandler = (event: IpcMainInvokeEvent, args: Record<string, unknown>) => Promise<unknown>;

describe('Extensions IPC', () => {
  const handlers = new Map<string, InvokeHandler>();

  beforeEach(() => {
    handlers.clear();
    vi.spyOn(ipcMain, 'handle').mockImplementation((channel: string, handler: InvokeHandler) => {
      handlers.set(channel, handler);
    });
    vi.spyOn(ipcMain, 'on').mockImplementation(() => ipcMain);

    setupExtensionsIPC(new Browser());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('registers the CRX message handler', () => {
    expect(handlers.has('extensions:crx-message')).toBe(true);
  });

  test('registers the runtime send-message handler', () => {
    expect(handlers.has(RUNTIME_SEND_MESSAGE_CHANNEL)).toBe(true);
  });

  test('registers the runtime send-response handler as a no-op', () => {
    expect(handlers.has(RUNTIME_SEND_RESPONSE_CHANNEL)).toBe(true);
  });

  test('registers the CRX message handler on a running service worker IPC scope', () => {
    const serviceWorkerHandlers = new Map<string, unknown>();
    const worker = {
      scriptURL: 'chrome-extension:test/service-worker.js',
      ipc: {
        handle: (channel: string, handler: unknown) => serviceWorkerHandlers.set(channel, handler),
      },
    };
    const serviceWorkers = {
      getWorkerFromVersionID: () => worker,
      getAllRunning: () => ({ 42: {} }),
      on: vi.fn(),
    };

    setupExtensionsServiceWorkerIPC(new Browser(), { serviceWorkers } as never);

    expect(serviceWorkerHandlers.has('extensions:crx-message')).toBe(true);
    expect(serviceWorkerHandlers.has(RUNTIME_SEND_MESSAGE_CHANNEL)).toBe(true);
  });
});
