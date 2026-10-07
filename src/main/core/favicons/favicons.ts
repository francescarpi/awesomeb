import Store from 'electron-store';
import {
  type TFaviconsStore,
  FaviconsStoreScheme,
  type IFavicon,
  type TFaviconData,
} from './schemes';
import { userDataPath } from '@/paths';
import { validateStore } from '@/core/validation';
import type { TTabId } from '~/types';
import { createHash } from 'crypto';
import { fetchFaviconUsingNet } from '@/core';
import { FAVICON_DAYS_EXPIRATION } from './constants';
import log from 'electron-log';

const scopeLog = log.scope('Favicons');

// TODO delete favicon when tab is permanently closed

export class Favicons extends Store<TFaviconsStore> {
  constructor() {
    const defaults: TFaviconsStore = { favicons: {} };

    super({
      name: 'favicons',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk, fall back to defaults if corrupted
    this.store = validateStore(FaviconsStoreScheme, this.store, 'Favicons', defaults);
  }

  async parseFavicon(tabId: TTabId, url: string): Promise<TFaviconData | null> {
    const hash = this.makeHash(url);
    const favicon = this.get(`favicons.${tabId}.favicons.${hash}`);

    if (favicon && !this.isExpired(favicon)) {
      return favicon.data;
    }

    const faviconData = await fetchFaviconUsingNet(url);
    if (!faviconData) {
      return null;
    }

    const faviconStore: IFavicon = {
      tabId,
      data: faviconData,
      created: Date.now(),
    };

    this.set(`favicons.${tabId}.favicons.${hash}`, faviconStore);
    this.set(`favicons.${tabId}.latest`, hash);

    return faviconData;
  }

  getLastFavicon(tabId: TTabId): TFaviconData | null {
    const lastHash = this.get(`favicons.${tabId}.latest`);
    if (!lastHash) {
      return null;
    }

    const lastFavicon = this.get(`favicons.${tabId}.favicons.${lastHash}`);
    if (!lastFavicon) {
      scopeLog.error(
        `There is an inconsistency. Tab id ${tabId} has latest has favicon but not the data`,
      );
      return null;
    }

    return lastFavicon.data;
  }

  deleteFavicon(tabId: TTabId) {
    this.delete(`favicons.${tabId}`);
  }

  private makeHash(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  private isExpired(favicon: IFavicon): boolean {
    return Date.now() - favicon.created > FAVICON_DAYS_EXPIRATION;
  }
}
