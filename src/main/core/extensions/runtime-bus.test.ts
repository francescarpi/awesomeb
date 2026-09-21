import { describe, expect, test, vi, beforeEach } from 'vitest';
import type { ServiceWorkerMain, WebContents } from 'electron';
import { RuntimeBus, type RuntimeMessageEnvelope } from './runtime-bus';

function makeWebContents(id: number, destroyed = false) {
  const sent: Array<{ channel: string; payload: unknown }> = [];
  const wc = {
    id,
    isDestroyed: vi.fn((): boolean => destroyed),
    send: vi.fn((channel: string, ...args: unknown[]) => {
      sent.push({ channel, payload: args[0] });
    }),
    once: vi.fn(),
  } as unknown as WebContents;
  return { wc, sent };
}

function makeServiceWorker(scriptURL: string) {
  const sent: Array<{ channel: string; payload: unknown }> = [];
  const worker = {
    scriptURL,
    send: vi.fn((channel: string, ...args: unknown[]) => {
      sent.push({ channel, payload: args[0] });
    }),
  } as unknown as ServiceWorkerMain;
  return { worker, sent };
}

describe('RuntimeBus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('registers and unregisters popups', () => {
    const bus = new RuntimeBus();
    const { wc } = makeWebContents(1);

    bus.registerPopup('ext-a', wc);
    expect(bus.hasRecipients('ext-a')).toBe(true);

    bus.unregisterPopup('ext-a', wc);
    expect(bus.hasRecipients('ext-a')).toBe(false);
  });

  test('send fans out to all popups except the sender', () => {
    const bus = new RuntimeBus();
    const { wc: wc1, sent: sent1 } = makeWebContents(101);
    const { wc: wc2, sent: sent2 } = makeWebContents(102);
    bus.registerPopup('ext-a', wc1);
    bus.registerPopup('ext-a', wc2);

    const envelope: RuntimeMessageEnvelope = {
      message: { type: 'hi' },
      sender: { id: 'ext-a', context: 'popup' },
    };

    bus.send('ext-a', envelope, `wc:${wc1.id}`);

    expect(sent1).toHaveLength(0);
    expect(sent2).toHaveLength(1);
    expect(sent2[0]?.channel).toBe('extensions:crx-event:runtime.onMessage');
    expect(sent2[0]?.payload).toEqual(envelope);
  });

  test('send fans out to SW when sender is a popup', () => {
    const bus = new RuntimeBus();
    const { worker, sent } = makeServiceWorker('chrome-extension://ext-a/sw.js');
    bus.setServiceWorker('ext-a', worker);

    const envelope: RuntimeMessageEnvelope = {
      message: { type: 'sync' },
      sender: { id: 'ext-a', context: 'background' },
    };

    bus.send('ext-a', envelope, `wc:999`);

    expect(sent).toHaveLength(1);
    expect(sent[0]?.payload).toEqual(envelope);
  });

  test('send excludes sender when sender is the SW', () => {
    const bus = new RuntimeBus();
    const { worker, sent } = makeServiceWorker('chrome-extension://ext-a/sw.js');
    bus.setServiceWorker('ext-a', worker);

    const envelope: RuntimeMessageEnvelope = {
      message: { type: 'sync' },
      sender: { id: 'ext-a', context: 'background' },
    };

    bus.send('ext-a', envelope, `sw:${worker.scriptURL}`);

    expect(sent).toHaveLength(0);
  });

  test('hasRecipients returns false when all popups are destroyed', () => {
    const bus = new RuntimeBus();
    const { wc } = makeWebContents(5, true);
    bus.registerPopup('ext-a', wc);
    expect(bus.hasRecipients('ext-a')).toBe(false);
  });

  test('removeExtension clears entry', () => {
    const bus = new RuntimeBus();
    const { worker } = makeServiceWorker('chrome-extension://ext-a/sw.js');
    bus.setServiceWorker('ext-a', worker);

    expect(bus.hasRecipients('ext-a')).toBe(true);
    bus.removeExtension('ext-a');
    expect(bus.hasRecipients('ext-a')).toBe(false);
  });

  test('send no-ops for unknown extension but does not throw', () => {
    const bus = new RuntimeBus();
    expect(() =>
      bus.send(
        'nonexistent',
        { message: 'x', sender: { id: 'nonexistent', context: 'popup' } },
        'wc:99',
      ),
    ).not.toThrow();
  });

  test('clearServiceWorker removes SW but leaves popups intact', () => {
    const bus = new RuntimeBus();
    const { worker } = makeServiceWorker('chrome-extension://ext-a/sw.js');
    const { wc } = makeWebContents(7);
    bus.setServiceWorker('ext-a', worker);
    bus.registerPopup('ext-a', wc);

    bus.clearServiceWorker('ext-a');
    expect(bus.hasRecipients('ext-a')).toBe(true);
  });
});
