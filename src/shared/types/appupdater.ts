export interface IAppUpdaterRelease {
  version: string;
  notes: string;
}

export interface IAppUpdaterInfo {
  version: string;
  current: string;
  releaseNotes: IAppUpdaterRelease[];
  status: 'available' | 'downloading' | 'downloaded' | 'error';
  progress: number;
}
