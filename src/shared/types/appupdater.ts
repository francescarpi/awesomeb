export interface IAppUpdaterInfo {
  version: string;
  current: string;
  releaseNotes: string;
  status: 'available' | 'downloading' | 'downloaded' | 'error';
  progress: number;
}
