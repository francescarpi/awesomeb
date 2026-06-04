import { contextBridge, ipcRenderer } from 'electron';
import type { TMediaAction } from '~/types';

export function iniMedia() {
  contextBridge.executeInMainWorld({
    func: (
      onPerformAction: (callback: (action: TMediaAction) => void) => void,
      registerGiveMeInfo: () => void,
    ) => {
      registerGiveMeInfo();
      onPerformAction((action) => {
        const video = document.querySelector('video');
        if (!video) {
          return;
        }

        switch (action) {
          case 'play':
            video.play();
            break;
          case 'pause':
            video.pause();
            break;
        }
      });
    },
    args: [
      (callback: (action: TMediaAction) => void) => {
        ipcRenderer.on('media:perform-action', (_event, params: { action: TMediaAction }) => {
          callback(params.action);
        });
      },
      () => {
        ipcRenderer.on(
          'media:give-me-info',
          (_event, params: { tabId: number; status: MediaSessionPlaybackState }) => {
            ipcRenderer.send('media:receive-info', {
              playbackState: params.status,
              tabId: params.tabId,
              title: navigator.mediaSession.metadata?.title || '',
              artist: navigator.mediaSession.metadata?.artist || '',
              album: navigator.mediaSession.metadata?.album || '',
            });
          },
        );
      },
    ],
  });
}
