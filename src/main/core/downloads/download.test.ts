import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from '@/core';
import type { DownloadItem } from 'electron';
import { EDownloadStatus } from '~/types';
import { Download } from './download';

function createHarness() {
  const emit = vi.fn();
  const browser = { eventsChannel: { emit } } as unknown as Browser;
  const item = {
    getSavePath: (): string => '/tmp/awesomeb/example.pdf',
    getTotalBytes: (): number => 1000,
    getReceivedBytes: (): number => 0,
    getFilename: (): string => 'example.pdf',
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  } as unknown as DownloadItem;

  return { download: new Download(browser, item), emit };
}

describe('Download progress broadcasting', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces rapid byte updates into a single trailing broadcast', () => {
    vi.useFakeTimers();
    const { download, emit } = createHarness();

    download.setReceivedBytes(100);
    download.setReceivedBytes(200);
    download.setReceivedBytes(300);

    expect(emit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('downloads:updated');
  });

  it('preserves the latest byte count seen during the debounce window', () => {
    vi.useFakeTimers();
    const { download, emit } = createHarness();

    download.setReceivedBytes(100);
    download.setReceivedBytes(500);
    download.setReceivedBytes(750);

    vi.advanceTimersByTime(300);

    expect(download.receivedBytes).toBe(750);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('does not schedule a broadcast when the byte count is unchanged', () => {
    vi.useFakeTimers();
    const { download, emit } = createHarness();

    download.setReceivedBytes(100);
    download.setReceivedBytes(100);

    vi.advanceTimersByTime(300);

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('schedules a new broadcast once the previous one has flushed', () => {
    vi.useFakeTimers();
    const { download, emit } = createHarness();

    download.setReceivedBytes(100);
    vi.advanceTimersByTime(300);

    emit.mockClear();

    download.setReceivedBytes(200);
    vi.advanceTimersByTime(300);

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('downloads:updated');
  });

  it('emits immediately on a status change and drops the pending progress broadcast', () => {
    vi.useFakeTimers();
    const { download, emit } = createHarness();

    download.setReceivedBytes(100);
    download.setStatus(EDownloadStatus.InProgress);

    expect(emit).toHaveBeenCalledWith('downloads:updated');

    emit.mockClear();

    vi.advanceTimersByTime(300);

    expect(emit).not.toHaveBeenCalled();
  });

  it('cancels the pending progress broadcast on pause, resume and cancel', () => {
    vi.useFakeTimers();
    const { download, emit } = createHarness();

    download.setReceivedBytes(100);
    download.pause();

    emit.mockClear();
    vi.advanceTimersByTime(300);
    expect(emit).not.toHaveBeenCalled();

    download.setReceivedBytes(150);
    download.resume();

    emit.mockClear();
    vi.advanceTimersByTime(300);
    expect(emit).not.toHaveBeenCalled();

    download.setReceivedBytes(200);
    download.cancel();

    emit.mockClear();
    vi.advanceTimersByTime(300);
    expect(emit).not.toHaveBeenCalled();
  });
});
