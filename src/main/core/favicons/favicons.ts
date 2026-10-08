import Store from 'electron-store';
import { nativeImage, type NativeImage } from 'electron';
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
import { DEFAULT_FAVICON, FAVICON_DAYS_EXPIRATION } from './constants';
import log from 'electron-log';

const scopeLog = log.scope('Favicons');

export class Favicons extends Store<TFaviconsStore> {
  constructor() {
    const defaults: TFaviconsStore = { favicons: {}, byTab: {}, byUrl: {} };

    super({
      name: 'favicons',
      cwd: userDataPath(),
      defaults,
      // Lets electron-store recover on its own when favicons.json is corrupted
      // (invalid JSON or schema mismatch) instead of throwing during construction.
      clearInvalidConfig: true,
    });

    this.store = validateStore(FaviconsStoreScheme, this.store, 'Favicons', defaults);
  }

  async parseFavicon(
    tabId: TTabId,
    faviconUrl: string,
    tabUrl: string,
  ): Promise<TFaviconData | null> {
    const faviconUrlHash = this.makeHash(faviconUrl);
    const favicon = this.get(`favicons.${faviconUrlHash}`);

    if (favicon && !this.isExpired(favicon)) {
      return favicon.imgData;
    }

    const normalizedTabUrl = this.makeUrlHash(tabUrl);

    let faviconImgData: TFaviconData | null;
    try {
      faviconImgData = await fetchFaviconUsingNet(faviconUrl);
    } catch (err) {
      scopeLog.warn(`Failed to fetch favicon from ${faviconUrl}:`, err);
      return null;
    }
    if (!faviconImgData) {
      return null;
    }

    const faviconStore: IFavicon = {
      created: Date.now(),
      imgData: faviconImgData,
    };

    const existingByTab = this.get(`byTab.${tabId}`) || { latest: faviconUrlHash, favicons: [] };
    if (!existingByTab.favicons.includes(faviconUrlHash)) {
      existingByTab.favicons.push(faviconUrlHash);
    }
    existingByTab.latest = faviconUrlHash;

    this.set(`favicons.${faviconUrlHash}`, faviconStore);
    this.set(`byTab.${tabId}`, existingByTab);

    if (!this.get(`byUrl.${normalizedTabUrl}`)) {
      this.set(`byUrl.${normalizedTabUrl}`, faviconUrlHash);
    }

    return faviconImgData;
  }

  getLastTabFavicon(tabId: TTabId): TFaviconData | null {
    const lastHash = this.get(`byTab.${tabId}.latest`);
    if (!lastHash) {
      return null;
    }

    const lastFavicon = this.get(`favicons.${lastHash}`);
    if (!lastFavicon) {
      scopeLog.error(
        `There is an inconsistency. Tab id ${tabId} has latest has favicon but not the data`,
      );
      return null;
    }

    return lastFavicon.imgData;
  }

  deleteFavicon(tabId: TTabId) {
    this.delete(`byTab.${tabId}`);
  }

  getFaviconByUrl(url: string, opts?: { size?: number }): NativeImage {
    const size = opts?.size ?? 12;
    const fallback = () =>
      nativeImage.createFromBuffer(DEFAULT_FAVICON).resize({ width: size, height: size });

    const urlHash = this.makeUrlHash(url);
    const faviconHash = this.get(`byUrl.${urlHash}`);
    if (!faviconHash) {
      return fallback();
    }

    const favicon = this.get(`favicons.${faviconHash}`) as IFavicon | undefined;
    if (!favicon || this.isExpired(favicon)) {
      return fallback();
    }

    return nativeImage.createFromDataURL(favicon.imgData).resize({ width: size, height: size });
  }

  makeUrlHash(url: string): string {
    let finalUrl = url;
    try {
      const parsed = new URL(url);
      parsed.hash = '';
      finalUrl = parsed.toString();
    } catch {
      scopeLog.warn(`Invalid URL: ${url}`);
    }

    return createHash('sha256').update(finalUrl).digest('hex');
  }

  private makeHash(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  private isExpired(favicon: IFavicon): boolean {
    return Date.now() - favicon.created > FAVICON_DAYS_EXPIRATION;
  }
}
