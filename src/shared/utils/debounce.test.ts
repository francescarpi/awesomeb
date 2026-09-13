import { afterEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires once after the wait window on rapid calls (trailing)', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 750);

    debounced('a');
    debounced('b');
    debounced('c');

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(750);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('resets the timer on each call so the last call within the window wins', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 750);

    debounced('a');
    vi.advanceTimersByTime(500);
    debounced('b');
    vi.advanceTimersByTime(500);
    debounced('c');

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(750);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('flush executes the pending call immediately and prevents the timer fire', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 750);

    debounced('a');
    debounced.flush();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');

    vi.advanceTimersByTime(750);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('flush is a no-op when nothing is pending (idempotent)', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 750);

    debounced.flush();
    debounced.flush();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(750);

    expect(fn).not.toHaveBeenCalled();
  });

  it('cancel discards the pending call without executing it', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 750);

    debounced('a');
    debounced.cancel();

    vi.advanceTimersByTime(750);

    expect(fn).not.toHaveBeenCalled();
  });

  it('calling again after cancel schedules a fresh invocation', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 750);

    debounced('a');
    debounced.cancel();

    debounced('b');
    vi.advanceTimersByTime(750);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });
});
