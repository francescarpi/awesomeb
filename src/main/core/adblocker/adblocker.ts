import { ElectronBlocker, adsAndTrackingLists } from '@ghostery/adblocker-electron';
import type { Session } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import log from 'electron-log';
import { userDataPath } from '@/paths';

const scopeLog = log.scope('AdBlocker');

const ENGINE_CACHE_FILE = 'adblocker-engine.bin';
const COSMETIC_ENGINE_CACHE_FILE = 'adblocker-cosmetic-engine.bin';
const ENGINE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The library registers the cosmetic filter IPC handlers globally
 * (`ipcMain.handle('@ghostery/adblocker/inject-cosmetic-filters')`), so a
 * second session trying to host them throws. Two engines are therefore kept:
 * a network-only one, enabled in every protected session, and a cosmetic-only
 * one, enabled in the default session alone.
 */
export class AdBlocker {
  private _networkBlocker: ElectronBlocker | null = null;
  private _cosmeticBlocker: ElectronBlocker | null = null;
  private _networkSessions: Session[] = [];
  private _cosmeticSession: Session | null = null;
  private _loading: Promise<void> | null = null;

  get isBlocking(): boolean {
    return this._networkBlocker !== null && this._networkSessions.length > 0;
  }

  private get engineCachePath(): string {
    return path.join(userDataPath(), ENGINE_CACHE_FILE);
  }

  private get cosmeticEngineCachePath(): string {
    return path.join(userDataPath(), COSMETIC_ENGINE_CACHE_FILE);
  }

  private async readCachedEngine(cachePath: string): Promise<ElectronBlocker | null> {
    try {
      const stats = await fs.stat(cachePath);
      if (Date.now() - stats.mtimeMs > ENGINE_CACHE_MAX_AGE_MS) {
        return null;
      }
      const buffer = await fs.readFile(cachePath);
      return ElectronBlocker.deserialize(new Uint8Array(buffer));
    } catch {
      return null;
    }
  }

  private async writeCachedEngine(blocker: ElectronBlocker, cachePath: string): Promise<void> {
    try {
      await fs.writeFile(cachePath, blocker.serialize());
    } catch (error) {
      scopeLog.warn('Could not cache the ad blocker engine:', error);
    }
  }

  private async load(): Promise<void> {
    const cached = await this.readCachedEngine(this.engineCachePath);

    if (cached) {
      this._networkBlocker = cached;
    } else {
      try {
        const blocker = await ElectronBlocker.fromLists(fetch, adsAndTrackingLists, {
          loadCosmeticFilters: false,
        });
        await this.writeCachedEngine(blocker, this.engineCachePath);
        this._networkBlocker = blocker;
      } catch (error) {
        scopeLog.error('Could not load the ad blocker filter lists:', error);
        return;
      }
    }

    const cachedCosmetic = await this.readCachedEngine(this.cosmeticEngineCachePath);

    if (cachedCosmetic) {
      this._cosmeticBlocker = cachedCosmetic;
    } else {
      try {
        const blocker = await ElectronBlocker.fromLists(fetch, adsAndTrackingLists, {
          loadNetworkFilters: false,
        });
        await this.writeCachedEngine(blocker, this.cosmeticEngineCachePath);
        this._cosmeticBlocker = blocker;
      } catch (error) {
        scopeLog.error('Could not load the ad blocker cosmetic filters:', error);
      }
    }
  }

  async init(sessions: Session[]): Promise<void> {
    if (!this._loading) {
      this._loading = this.load().catch((error) => {
        scopeLog.error('Could not initialize the ad blocker:', error);
      });
    }

    await this._loading;

    this.enableInSessions(sessions);
  }

  async enable(sessions: Session[]): Promise<void> {
    if (!this._networkBlocker) {
      await this.init(sessions);
      return;
    }

    this.enableInSessions(sessions);
  }

  private enableInSessions(sessions: Session[]): void {
    if (this._networkBlocker) {
      for (const session of sessions) {
        if (this._networkSessions.includes(session)) {
          continue;
        }
        this._networkBlocker.enableBlockingInSession(session);
        this._networkSessions.push(session);
      }
    }

    const cosmeticTarget = sessions[0];

    if (cosmeticTarget && this._cosmeticBlocker && this._cosmeticSession !== cosmeticTarget) {
      if (this._cosmeticSession) {
        this._cosmeticBlocker.disableBlockingInSession(this._cosmeticSession);
      }
      this._cosmeticBlocker.enableBlockingInSession(cosmeticTarget);
      this._cosmeticSession = cosmeticTarget;
    }
  }

  async disable(): Promise<void> {
    if (this._networkBlocker) {
      for (const session of this._networkSessions) {
        this._networkBlocker.disableBlockingInSession(session);
      }
    }
    this._networkSessions = [];

    if (this._cosmeticBlocker && this._cosmeticSession) {
      this._cosmeticBlocker.disableBlockingInSession(this._cosmeticSession);
    }
    this._cosmeticSession = null;
  }

  async apply(enabled: boolean, sessions: Session[]): Promise<void> {
    if (enabled) {
      await this.enable(sessions);
    } else {
      await this.disable();
    }
  }
}
