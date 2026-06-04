import type { TTabId } from '~/types';
import type { IMediaSessionState } from './types';
import log from 'electron-log';
import { Browser } from '@/core';

const scopeLog = log.scope('MediaManager');

export class MediaManager {
  private sessions = new Map<TTabId, IMediaSessionState>();

  constructor(private readonly browser: Browser) {}

  addSession(tabId: TTabId, session: IMediaSessionState) {
    this.sessions.set(tabId, session);
    this.requestInfo(tabId, 'playing');
    scopeLog.info(`Added media session for tab ${tabId}`);
  }

  removeSession(tabId: TTabId) {
    this.sessions.delete(tabId);
    scopeLog.info(`Removed media session for tab ${tabId}`);
  }

  requestInfo(tabId: TTabId, status: MediaSessionPlaybackState = 'none') {
    const session = this.sessions.get(tabId);
    if (session) {
      session.wc.send('media:give-me-info', { tabId, status });
      scopeLog.info(`Requested media session info for tab ${tabId}`);
    }
  }

  updateData(tabId: TTabId, data: IMediaSessionState['data']) {
    const session = this.sessions.get(tabId);
    if (session) {
      session.data = data;
      scopeLog.info(`Updated media session data for tab ${tabId}`, data);
      this.browser.eventsChannel.emit('media:session-updated');
    }
  }

  get lastSession(): IMediaSessionState | null {
    const sessionsArray = Array.from(this.sessions.values());
    return sessionsArray.length > 0 ? sessionsArray[sessionsArray.length - 1] : null;
  }

  getSession(tabId: TTabId): IMediaSessionState | null {
    return this.sessions.get(tabId) || null;
  }
}
