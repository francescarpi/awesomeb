import { type WebContents } from 'electron';
import type { TTabId } from '~/types';

export interface IMediaSessionState {
  tabId: TTabId;
  favicon: string | null;
  wc: WebContents;
  startedAt: number;
  data?: {
    playbackState: MediaSessionPlaybackState;
    title: string;
    artist: string;
    album: string;
  };
}
