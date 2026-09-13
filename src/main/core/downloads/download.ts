import { DownloadItem, shell } from 'electron';
import { Browser } from '@/core';
import { debounce } from '~/utils/debounce';
import path from 'path';
import { EDownloadStatus } from '~/types';

const PROGRESS_UPDATE_DEBOUNCE_MS = 300;

export class Download {
  private _status: EDownloadStatus = EDownloadStatus.Idle;
  private _receivedBytes: number = 0;
  private _visited: boolean = false;
  private _createdAt: number = Date.now();
  private readonly _emitUpdate: ReturnType<typeof debounce<() => void>>;

  constructor(
    private readonly _browser: Browser,
    private readonly _item: DownloadItem,
  ) {
    this._emitUpdate = debounce(
      () => this._browser.eventsChannel.emit('downloads:updated'),
      PROGRESS_UPDATE_DEBOUNCE_MS,
    );
  }

  setStatus(status: EDownloadStatus) {
    if (status === this._status) {
      return;
    }

    this._status = status;
    this._emitUpdate.cancel();
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
    this._emitUpdate();
  }

  get receivedBytes(): number {
    return this._receivedBytes;
  }

  setVisited(visited: boolean) {
    if (visited === this._visited) {
      return;
    }

    this._visited = visited;
    this._emitUpdate.cancel();
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
    this._emitUpdate.cancel();
    this._browser.eventsChannel.emit('downloads:updated');
  }

  pause() {
    this._item.pause();
    this._emitUpdate.cancel();
    this._browser.eventsChannel.emit('downloads:updated');
  }

  resume() {
    this._item.resume();
    this._emitUpdate.cancel();
    this._browser.eventsChannel.emit('downloads:updated');
  }

  open() {
    shell.showItemInFolder(this.savePath);
  }
}
