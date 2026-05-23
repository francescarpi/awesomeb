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
  created: number;
}

export enum EDownloadStatus {
  Idle = 'idle',
  InProgress = 'in_progress',
  Interrupted = 'interrupted',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Paused = 'paused',
}
