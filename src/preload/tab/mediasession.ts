import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { IMediaSessionInfo, TMediaSessionAction } from '~/types';

export function iniMedia() {
  contextBridge.executeInMainWorld({
    func: (
      setMediaSession: (info: IMediaSessionInfo | null) => void,
      onAction: (callback: (event: IpcRendererEvent, action: TMediaSessionAction) => void) => void,
    ) => {
      function debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number,
      ): (...args: Parameters<T>) => void {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        return function (...args: Parameters<T>) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
          }, wait);
        };
      }
      const updatePlaybackState = (volume: number) => {
        const { metadata, playbackState } = navigator.mediaSession;
        setMediaSession(
          metadata
            ? {
                title: metadata.title,
                album: metadata.album,
                artist: metadata.artist,
                state: playbackState,
                volume,
              }
            : null,
        );
      };

      document.addEventListener('DOMContentLoaded', () => {
        const video = document.querySelector('video');
        if (video) {
          updatePlaybackState(video.volume);

          video.addEventListener('play', () => {
            navigator.mediaSession.playbackState = 'playing';
            updatePlaybackState(video.volume);
          });

          video.addEventListener('pause', () => {
            navigator.mediaSession.playbackState = 'paused';
            updatePlaybackState(video.volume);
          });

          const handleVolumeChange = debounce((e: Event) => {
            const volume = (e.target as HTMLVideoElement).volume;
            updatePlaybackState(volume);
          }, 300);

          video.addEventListener('volumechange', handleVolumeChange);

          onAction((_event, action) => {
            switch (action) {
              case 'play':
                video.play();
                break;
              case 'pause':
                video.pause();
                break;
              case 'mute': {
                video.volume = 0;
                break;
              }
              case 'unmute':
                video.volume = 1;
                break;
            }
          });
        }
      });
    },
    args: [
      (info: IMediaSessionInfo | null) => {
        ipcRenderer.send('window:media-session-changed', { info });
      },
      (callback: (event: IpcRendererEvent, action: TMediaSessionAction) => void) => {
        ipcRenderer.on('media-session-action', callback);
      },
    ],
  });
}
