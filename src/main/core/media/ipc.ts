import { Browser } from '@/core';
import { createHandler, tabChecker, windowChecker, viewChecker } from '@/utils';
import type { IWinDesConTab, TTabId, TMediaAction } from '~/types';

export function setupMediaIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{
    tab: IWinDesConTab;
    playbackState: MediaSessionPlaybackState;
    title: string;
    artist: string;
    album: string;
  }>(
    'media:receive-info',
    'on',
    browser,
    [tabChecker],
    async ({ tab, playbackState, title, artist, album }) => {
      browser.mediaManager.updateData(tab.tab.id, { playbackState, title, artist, album });
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'media:get',
    'handle',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar'])],
    async ({}) => {
      return browser.mediaManager.lastSession;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tabId: TTabId; action: TMediaAction }>(
    'media:action',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar'])],
    async ({ tabId, action }) => {
      const session = browser.mediaManager.getSession(tabId);
      if (!session) {
        console.warn(`No media session found for tab ${tabId}`);
        return;
      }

      const tabData = browser.getTab(tabId);
      if (!tabData) {
        console.warn(`No tab data found for tab ${tabId}`);
        return;
      }

      if (action === 'toggleMute') {
        tabData.tab.toggleMute();
        browser.toRenderer.refreshMediaSession(tabData.window, session);
      } else {
        session.wc.send('media:perform-action', { action });
      }
    },
  );
}
