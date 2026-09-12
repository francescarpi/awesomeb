import { DownloadItem, shell } from 'electron';
import { Browser } from '@/core';
import path from 'path';
import { EDownloadStatus } from '~/types';

const PROGRESS_UPDATE_DEBOUNCE_MS = 300;

export class Download {
  private _status: EDownloadStatus = EDownloadStatus.Idle;
  private _receivedBytes: number = 0;
  private _visited: boolean = false;
  private _createdAt: number = Date.now();
  private _progressUpdateScheduled: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly _browser: Browser,
    private readonly _item: DownloadItem,
  ) {}

  setStatus(status: EDownloadStatus) {
    if (status === this._status) {
      return;
    }

    this._status = status;
    this.clearProgressUpdate();
    this._browser.eventsChannel.emit('downloads:updated');

    if (status === EDownloadStatus.Completed) {
      this._browser.eventsChannel.emit('downloads:completed', this);
    }
  }

  get status(): EDownloadStatus {
    return this._status;
  }

  setReceivedBytes(bytes: number) {
    if (bytes === this._receivedBytes) {
      return;
    }

    this._receivedBytes = bytes;
    this.scheduleProgressUpdate();
  }

  private scheduleProgressUpdate() {
    if (this._progressUpdateScheduled) {
      return;
    }

    this._progressUpdateScheduled = setTimeout(() => {
      this._progressUpdateScheduled = null;
      this._browser.eventsChannel.emit('downloads:updated');
    }, PROGRESS_UPDATE_DEBOUNCE_MS);
  }

  private clearProgressUpdate() {
    if (!this._progressUpdateScheduled) {
      return;
    }

    clearTimeout(this._progressUpdateScheduled);
    this._progressUpdateScheduled = null;
  }

  get receivedBytes(): number {
    return this._receivedBytes;
  }

  setVisited(visited: boolean) {
    if (visited === this._visited) {
      return;
    }

    this._visited = visited;
    this.clearProgressUpdate();
    this._browser.eventsChannel.emit('downloads:updated');
  }

  get visited(): boolean {
    return this._visited;
  }

  get progress(): number {
    if (this._item.getTotalBytes() === 0) {
      return 0;
    }
    return this._receivedBytes / this._item.getTotalBytes();
  }

  get savePath(): string {
    return this._item.getSavePath();
  }

  get fileName(): string {
    return path.basename(this.savePath);
  }

  get created(): number {
    return this._createdAt;
  }

  cancel() {
    this._item.cancel();
    this.clearProgressUpdate();
    this._browser.eventsChannel.emit('downloads:updated');
  }

  pause() {
    this._item.pause();
    this.clearProgressUpdate();
    this._browser.eventsChannel.emit('downloads:updated');
  }

  resume() {
    this._item.resume();
    this.clearProgressUpdate();
    this._browser.eventsChannel.emit('downloads:updated');
  }

  open() {
    shell.showItemInFolder(this.savePath);
  }
}
