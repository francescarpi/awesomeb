import { EDownloadStatus } from '@/core';

export interface IDownloads {
  downloading: boolean;
  progress: number;
  items: IDownloadItem[];
}

export interface IDownloadItem {
  savePath: string;
  fileName: string;
  progress: number;
  status: EDownloadStatus;
  visited: boolean;
}
