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
import { parseFavicon } from '@/core';
import { WebContents } from 'electron';

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

  async parseFavicon(wc: WebContents, tabId: TTabId, url: string): Promise<TFaviconData | null> {
    const hash = this.makeHash(url);
    const favicon = this.store.favicons[tabId]?.[hash];

    if (favicon && !this.isExpired(favicon)) {
      return favicon.data;
    }

    const data = await parseFavicon(wc, url);

    console.log('CESC', hash, favicon, data);
    // TODO create object or update data in store

    // - make url hash
    // - check if we already have this favicon in the store: tabid->hash->metadata
    //  - if yes: ignore
    //  - if not or expired: update
    return null;
  }

  getFavicon(_tabId: TTabId): TFaviconData | null {
    // TODO implement
    return null;
  }

  private makeHash(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  private isExpired(_favicon: IFavicon): boolean {
    // TODO implement
    return false;
  }
}
