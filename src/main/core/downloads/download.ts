import { EDownloadStatus } from './types';
import { DownloadItem } from 'electron';
import { Browser } from '@/core';
import path from 'path';

export class Download {
  private _status: EDownloadStatus = EDownloadStatus.Idle;
  private _receivedBytes: number = 0;
  private _visited: boolean = false;

  constructor(
    private readonly _browser: Browser,
    private readonly _item: DownloadItem,
  ) {}

  setStatus(status: EDownloadStatus) {
    if (status === this._status) {
      return;
    }

    this._status = status;
    this._browser.eventsChannel.emit('downloads:updated');
  }

  get status(): EDownloadStatus {
    return this._status;
  }

  setReceivedBytes(bytes: number) {
    if (bytes === this._receivedBytes) {
      return;
    }

    this._receivedBytes = bytes;
    this._browser.eventsChannel.emit('downloads:updated');
  }

  get receivedBytes(): number {
    return this._receivedBytes;
  }

  setVisited(visited: boolean) {
    if (visited === this._visited) {
      return;
    }

    this._visited = visited;
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
}
