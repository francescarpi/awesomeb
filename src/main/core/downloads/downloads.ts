import { DownloadItem } from 'electron';
import { Browser } from '@/core';
import { Download } from './download';
import { EDownloadStatus } from '~/types';

export class Downloads {
  private _downloads: Map<string, Download> = new Map();

  constructor(private readonly _browser: Browser) {}

  add(item: DownloadItem) {
    this._downloads.set(item.getSavePath(), new Download(this._browser, item));
    this._browser.eventsChannel.emit('downloads:updated');
  }

  get(savePath: string): Download | null {
    return this._downloads.get(savePath) || null;
  }

  get all(): Download[] {
    return Array.from(this._downloads.values());
  }

  clearCompleted() {
    for (const [savePath, download] of this._downloads) {
      if (
        download.status === EDownloadStatus.Completed ||
        download.status === EDownloadStatus.Cancelled
      ) {
        this._downloads.delete(savePath);
      }
    }
    this._browser.eventsChannel.emit('downloads:updated');
  }
}
