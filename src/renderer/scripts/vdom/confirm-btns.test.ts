import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import type { JSDOM } from 'jsdom';
import { confirmButtons } from './confirm-btns';
import { render } from './vdom';
import type { VNode } from './types';

const asEl = (n: VNode | string): HTMLElement => render(n) as HTMLElement;

const setGlobal = (key: string, value: unknown): void => {
  (globalThis as Record<string, unknown>)[key] = value;
};

const pressKey = (key: string): void => {
  const event = new dom.window.KeyboardEvent('keydown', { key, bubbles: true });
  dom.window.dispatchEvent(event);
};

let dom: JSDOM;

beforeEach(async () => {
  const { JSDOM } = await import('jsdom');
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  setGlobal('window', dom.window);
  setGlobal('document', dom.window.document);
  setGlobal('KeyboardEvent', dom.window.KeyboardEvent);
  setGlobal('abI18n', {
    t: async () => ({ ok: 'OK', cancel: 'Cancel' }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mount = async (
  options: Partial<Parameters<typeof confirmButtons>[0]> = {},
): Promise<{
  result: Awaited<ReturnType<typeof confirmButtons>>;
  confirmBtn: HTMLButtonElement;
  cancelBtn: HTMLButtonElement | null;
}> => {
  const result = await confirmButtons({
    winId: 1,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...options,
  });

  const container = dom.window.document.createElement('div');
  for (const vnode of result.vnode) {
    container.appendChild(asEl(vnode));
  }
  dom.window.document.body.appendChild(container);

  return {
    result,
    confirmBtn: dom.window.document.querySelector('button#confirm')!,
    cancelBtn: dom.window.document.querySelector('button#cancel'),
  };
};

describe('confirmButtons — shape', () => {
  test('returns an object exposing vnode, registerEvents and the state setters', async () => {
    const { result } = await mount();

    expect(Array.isArray(result.vnode)).toBe(true);
    expect(typeof result.registerEvents).toBe('function');
    expect(typeof result.setLoading).toBe('function');
    expect(typeof result.setConfirmEnabled).toBe('function');
    expect(typeof result.setCancelEnabled).toBe('function');
  });

  test('renders both buttons when onCancel is provided', async () => {
    const { cancelBtn, confirmBtn } = await mount();

    expect(confirmBtn).not.toBeNull();
    expect(cancelBtn).not.toBeNull();
  });

  test('renders only the confirm button when onCancel is omitted', async () => {
    const { cancelBtn, confirmBtn } = await mount({ onCancel: undefined });

    expect(confirmBtn).not.toBeNull();
    expect(cancelBtn).toBeNull();
  });

  test('applies the initial disabled state to the buttons', async () => {
    const { confirmBtn, cancelBtn } = await mount({
      confirmDisabled: true,
      cancelDisabled: true,
    });

    expect(confirmBtn.disabled).toBe(true);
    expect(cancelBtn!.disabled).toBe(true);
  });
});

describe('confirmButtons — keyboard handling', () => {
  test('Enter triggers onConfirm when the confirm button is enabled', async () => {
    const onConfirm = vi.fn();
    const { result } = await mount({ onConfirm });
    result.registerEvents();

    pressKey('Enter');

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('Enter does not trigger onConfirm when the confirm button is disabled', async () => {
    const onConfirm = vi.fn();
    const { result } = await mount({ onConfirm, confirmDisabled: true });
    result.registerEvents();

    pressKey('Enter');

    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('Escape triggers onCancel when the cancel button is enabled', async () => {
    const onCancel = vi.fn();
    const { result } = await mount({ onCancel });
    result.registerEvents();

    pressKey('Escape');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('Escape does not trigger onCancel when the cancel button is disabled', async () => {
    const onCancel = vi.fn();
    const { result } = await mount({ onCancel, cancelDisabled: true });
    result.registerEvents();

    pressKey('Escape');

    expect(onCancel).not.toHaveBeenCalled();
  });

  test('Escape falls back to onConfirm when there is no cancel button', async () => {
    const onConfirm = vi.fn();
    const { result } = await mount({ onConfirm, onCancel: undefined });
    result.registerEvents();

    pressKey('Escape');

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('registering events twice does not duplicate the keydown listener', async () => {
    const onConfirm = vi.fn();
    const { result } = await mount({ onConfirm });
    const addSpy = vi.spyOn(dom.window, 'addEventListener');
    result.registerEvents();
    result.registerEvents();

    expect(addSpy.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(2);
    expect(addSpy.mock.calls.filter(([type]) => type === 'keydown')[0][1]).toBe(
      addSpy.mock.calls.filter(([type]) => type === 'keydown')[1][1],
    );

    pressKey('Enter');
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('registering events twice removes the previous listener before adding a new one', async () => {
    const onConfirm = vi.fn();
    const { result } = await mount({ onConfirm });
    const removeSpy = vi.spyOn(dom.window, 'removeEventListener');
    result.registerEvents();
    result.registerEvents();

    expect(removeSpy.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
  });

  test('the cleanup function removes the keydown listener', async () => {
    const onConfirm = vi.fn();
    const { result } = await mount({ onConfirm });
    const cleanup = result.registerEvents();

    cleanup();
    pressKey('Enter');

    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('confirmButtons — state setters', () => {
  test('setConfirmEnabled enables and disables the confirm button', async () => {
    const { result, confirmBtn } = await mount({ confirmDisabled: true });

    result.setConfirmEnabled(true);
    expect(confirmBtn.disabled).toBe(false);

    result.setConfirmEnabled(false);
    expect(confirmBtn.disabled).toBe(true);
  });

  test('setCancelEnabled enables and disables the cancel button', async () => {
    const { result, cancelBtn } = await mount({ cancelDisabled: true });

    result.setCancelEnabled(true);
    expect(cancelBtn!.disabled).toBe(false);

    result.setCancelEnabled(false);
    expect(cancelBtn!.disabled).toBe(true);
  });

  test('setLoading(true) shows the spinner and disables the confirm button', async () => {
    const { result, confirmBtn } = await mount();

    result.setLoading(true);

    expect(confirmBtn.disabled).toBe(true);
    expect(confirmBtn.querySelector('span.loading')!.classList.contains('hidden')).toBe(false);
  });

  test('setLoading(false) hides the spinner and restores the confirm button', async () => {
    const { result, confirmBtn } = await mount();

    result.setLoading(true);
    result.setLoading(false);

    expect(confirmBtn.disabled).toBe(false);
    expect(confirmBtn.querySelector('span.loading')!.classList.contains('hidden')).toBe(true);
  });

  test('setLoading(false) does not re-enable a button disabled by setConfirmEnabled', async () => {
    const { result, confirmBtn } = await mount();

    result.setConfirmEnabled(false);
    result.setLoading(true);
    result.setLoading(false);

    expect(confirmBtn.disabled).toBe(true);
  });

  test('setConfirmEnabled(false) keeps the button disabled while loading', async () => {
    const { result, confirmBtn } = await mount();

    result.setLoading(true);
    result.setConfirmEnabled(false);
    result.setLoading(false);

    expect(confirmBtn.disabled).toBe(true);
  });

  test('Enter is ignored while the confirm button is loading', async () => {
    const onConfirm = vi.fn();
    const { result } = await mount({ onConfirm });
    result.registerEvents();

    result.setLoading(true);
    pressKey('Enter');

    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('the setters do not throw when the buttons are not in the DOM', async () => {
    const result = await confirmButtons({
      winId: 1,
      onConfirm: vi.fn(),
    });

    expect(() => result.setLoading(true)).not.toThrow();
    expect(() => result.setConfirmEnabled(true)).not.toThrow();
    expect(() => result.setCancelEnabled(true)).not.toThrow();
  });
});
