import type { TTabId } from '~/types';

export interface IMediaSession {
  tabId: TTabId;
  favicon: string | null;
  startedAt: number;
  playbackState: MediaSessionPlaybackState;
  title: string;
  artist: string;
  album: string;
  muted: boolean;
}

export type TMediaAction = 'play' | 'pause' | 'toggleMute';
