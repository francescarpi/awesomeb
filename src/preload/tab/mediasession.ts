import { contextBridge, ipcRenderer } from 'electron';
import type { TMediaAction, TTabId } from '~/types';

interface IInfoToSend {
  playbackState: MediaSessionPlaybackState;
  tabId: TTabId;
  title: string;
  artist: string;
  album: string;
}

export function iniMedia() {
  contextBridge.executeInMainWorld({
    func: (
      onPerformAction: (callback: (action: TMediaAction) => void) => void,
      registerGiveMeInfo: (
        callback: (tabId: TTabId, playbackState: MediaSessionPlaybackState) => IInfoToSend | null,
      ) => void,
    ) => {
      registerGiveMeInfo((tabId, playbackState) => {
        if (!document.querySelector('video') || navigator.mediaSession.metadata === null) {
          return null;
        }

        return {
          playbackState,
          tabId,
          title: navigator.mediaSession.metadata?.title || '',
          artist: navigator.mediaSession.metadata?.artist || '',
          album: navigator.mediaSession.metadata?.album || '',
        };
      });

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
      (
        callback: (tabId: TTabId, playbackState: MediaSessionPlaybackState) => IInfoToSend | null,
      ) => {
        ipcRenderer.on(
          'media:give-me-info',
          (_event, params: { tabId: number; status: MediaSessionPlaybackState }) => {
            const data = callback(params.tabId, params.status);
            if (data) {
              ipcRenderer.send('media:receive-info', data);
            }
          },
        );
      },
    ],
  });
}
