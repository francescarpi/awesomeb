import { EDownloadStatus } from './types';
import { DownloadItem } from 'electron';

export class Download {
  private _status: EDownloadStatus = EDownloadStatus.Idle;
  private _receivedBytes: number = 0;

  constructor(private readonly _item: DownloadItem) {}

  get status(): EDownloadStatus {
    return this._status;
  }

  setStatus(status: EDownloadStatus) {
    // TODO emit event to browser
    this._status = status;
  }

  setReceivedBytes(bytes: number) {
    // TODO emit event to browser
    this._receivedBytes = bytes;
  }
}
