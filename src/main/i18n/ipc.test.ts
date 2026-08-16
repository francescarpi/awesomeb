import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { Browser } from '@/core';

const { mockGetCurrentLocale, mockSetLocale } = vi.hoisted(() => ({
  mockGetCurrentLocale: vi.fn((): 'en' | 'es' | 'ca' => 'en'),
  mockSetLocale: vi.fn(async (_locale: 'en' | 'es' | 'ca'): Promise<void> => {}),
}));

vi.mock('@/i18n', () => ({
  getCurrentLocale: mockGetCurrentLocale,
  setLocale: mockSetLocale,
}));

type Handler = (event: IpcMainInvokeEvent, args: Record<string, unknown>) => Promise<unknown>;
const handlers = new Map<string, Handler>();

function makeEvent(id = 1, destroyed = false): IpcMainInvokeEvent {
  return {
    sender: {
      id,
      isDestroyed: (): boolean => destroyed,
      send: vi.fn(),
    },
  } as unknown as IpcMainInvokeEvent;
}

describe('I18n IPC', () => {
  let browser: Browser;

  beforeEach(async () => {
    handlers.clear();
    mockGetCurrentLocale.mockReturnValue('en');
    mockSetLocale.mockClear();
    mockSetLocale.mockResolvedValue(undefined);

    vi.spyOn(ipcMain, 'handle').mockImplementation((channel: string, fn: Handler) => {
      handlers.set(channel, fn);
    });

    const { setupI18nIPC } = await import('./ipc');
    browser = new Browser();
    vi.spyOn(browser.toRenderer, 'broadcast').mockImplementation(() => {});

    setupI18nIPC(browser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handler registration', () => {
    test('registers i18n:get-locale', () => {
      expect(handlers.has('i18n:get-locale')).toBe(true);
    });

    test('registers i18n:set-locale', () => {
      expect(handlers.has('i18n:set-locale')).toBe(true);
    });
  });

  describe('i18n:get-locale', () => {
    test('returns the current locale', async () => {
      mockGetCurrentLocale.mockReturnValue('ca');
      const handler = handlers.get('i18n:get-locale')!;
      const result = await handler(makeEvent(), {});
      expect(result).toBe('ca');
    });

    test('returns en when getCurrentLocale returns en', async () => {
      mockGetCurrentLocale.mockReturnValue('en');
      const handler = handlers.get('i18n:get-locale')!;
      const result = await handler(makeEvent(), {});
      expect(result).toBe('en');
    });
  });

  describe('i18n:set-locale', () => {
    test('returns success:false for invalid locale', async () => {
      const handler = handlers.get('i18n:set-locale')!;
      const result = await handler(makeEvent(), { locale: 'xx' });
      expect(result).toEqual({ success: false, locale: 'en' });
      expect(mockSetLocale).not.toHaveBeenCalled();
      expect(browser.toRenderer.broadcast).not.toHaveBeenCalled();
    });

    test('returns success:false for non-string locale', async () => {
      const handler = handlers.get('i18n:set-locale')!;
      const result = await handler(makeEvent(), { locale: 42 });
      expect(result).toEqual({ success: false, locale: 'en' });
      expect(mockSetLocale).not.toHaveBeenCalled();
    });

    test('returns success:false for null locale', async () => {
      const handler = handlers.get('i18n:set-locale')!;
      const result = await handler(makeEvent(), { locale: null });
      expect(result).toEqual({ success: false, locale: 'en' });
      expect(mockSetLocale).not.toHaveBeenCalled();
    });

    test('calls setLocale and broadcasts for valid locale', async () => {
      const handler = handlers.get('i18n:set-locale')!;
      const event = makeEvent(7);
      const result = await handler(event, { locale: 'es' });

      expect(result).toEqual({ success: true, locale: 'es' });
      expect(mockSetLocale).toHaveBeenCalledWith('es');
      expect(browser.toRenderer.broadcast).toHaveBeenCalledWith('i18n:locale-changed', 'es');
      expect(event.sender.send).toHaveBeenCalledWith('i18n:locale-changed', 'es');
    });

    test('accepts ca locale and broadcasts', async () => {
      const handler = handlers.get('i18n:set-locale')!;
      const event = makeEvent(7);
      const result = await handler(event, { locale: 'ca' });

      expect(result).toEqual({ success: true, locale: 'ca' });
      expect(mockSetLocale).toHaveBeenCalledWith('ca');
      expect(browser.toRenderer.broadcast).toHaveBeenCalledWith('i18n:locale-changed', 'ca');
    });

    test('skips sender.send when sender is destroyed', async () => {
      const handler = handlers.get('i18n:set-locale')!;
      const event = makeEvent(7, true);
      const result = await handler(event, { locale: 'es' });

      expect(result).toEqual({ success: true, locale: 'es' });
      expect(mockSetLocale).toHaveBeenCalledWith('es');
      expect(browser.toRenderer.broadcast).toHaveBeenCalledWith('i18n:locale-changed', 'es');
      expect(event.sender.send).not.toHaveBeenCalled();
    });
  });
});
