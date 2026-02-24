import { DownloadItem } from 'electron';
import { Browser } from '@/core';
import { Download } from './download';

export class Downloads {
  private _downloads: Map<string, Download> = new Map();

  constructor(private readonly _browser: Browser) {}

  add(item: DownloadItem) {
    this._downloads.set(item.getSavePath(), new Download(item));

    // TODO emmit a browser event
  }

  get(savePath: string): Download | null {
    return this._downloads.get(savePath) || null;
  }

  // TODO add list method
  // TODO add another list to mark wich downlads were visited
  // TODO list method should return an object like: id, status, visited, etc...
}
