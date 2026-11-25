import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { app } from 'electron';
import { Browser, notification } from '@/core';
import { IAppUpdaterInfo, IAppUpdaterRelease } from '~/types';
import { t } from '~/i18n';
import { cleanReleaseNotes } from './helpers';

const scopeLog = log.scope('AppUpdater');

export class AppUpdater {
  private data: IAppUpdaterInfo | null = null;
  private checking = false;
  private updateAvailableDuringCheck = false;

  constructor(private readonly browser: Browser) {
    log.transports.file.level = 'debug';
    autoUpdater.logger = scopeLog;
    autoUpdater.forceDevUpdateConfig = !app.isPackaged;
    autoUpdater.autoDownload = false;
    autoUpdater.fullChangelog = true;

    autoUpdater.on('update-available', (info) => {
      this.updateAvailableDuringCheck = true;
      this.data = {
        version: info.version,
        current: app.getVersion(),
        releaseNotes: this.buildReleaseNotes(info),
        status: 'available',
        progress: 0,
      };
      this.emit();
    });

    autoUpdater.on('download-progress', (progressObj) => {
      if (this.data) {
        this.data.progress = progressObj.percent;
        this.emit();
      }
    });

    autoUpdater.on('update-downloaded', () => {
      if (this.data) {
        this.data.status = 'downloaded';
        this.emit();
      }
    });

    setTimeout(() => {
      this.checkForUpdates();
    }, 3000);
  }

  private emit() {
    this.browser.eventsChannel.emit('appupdater:version-available', this.data);
  }

  private buildReleaseNotes(info: {
    version: string;
    releaseNotes?: string | Array<{ version: string; note: string | null }> | null;
  }): IAppUpdaterRelease[] {
    if (Array.isArray(info.releaseNotes)) {
      return info.releaseNotes.map((entry) => ({
        version: entry.version,
        notes: cleanReleaseNotes(entry.note ?? ''),
      }));
    }

    if (typeof info.releaseNotes === 'string' && info.releaseNotes.trim().length > 0) {
      return [{ version: info.version, notes: cleanReleaseNotes(info.releaseNotes) }];
    }

    return [];
  }

  get versionAvailable(): IAppUpdaterInfo | null {
    return this.data;
  }

  get isChecking(): boolean {
    return this.checking;
  }

  checkForUpdates(manual = false) {
    if (this.checking) {
      return;
    }

    this.checking = true;
    this.updateAvailableDuringCheck = false;

    try {
      void Promise.resolve(autoUpdater.checkForUpdates()).then(
        () => {
          this.checking = false;
          void this.browser.refreshMainMenu();
          if (manual && !this.updateAvailableDuringCheck && !this.data) {
            notification(
              t('notifications:updatesCheckComplete.title'),
              t('notifications:updatesCheckComplete.body'),
            );
          }
        },
        (error) => {
          this.checking = false;
          void this.browser.refreshMainMenu();
          scopeLog.error('Failed to check for updates', error);
        },
      );
    } catch (error) {
      this.checking = false;
      throw error;
    }
  }

  downloadUpdate() {
    if (!this.data) {
      return;
    }

    this.data.status = 'downloading';
    this.emit();
    autoUpdater.downloadUpdate();
  }

  quitAndInstall() {
    autoUpdater.quitAndInstall();
  }
}
