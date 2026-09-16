import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { app } from 'electron';
import { Browser, notification } from '@/core';
import { IAppUpdaterInfo } from '~/types';
import { t } from '~/i18n';
import { removeAllAnchors } from './helpers';

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

    autoUpdater.on('update-available', (info) => {
      this.updateAvailableDuringCheck = true;
      this.data = {
        version: info.version,
        current: app.getVersion(),
        releaseNotes:
          typeof info.releaseNotes === 'string' ? removeAllAnchors(info.releaseNotes) : '',
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
          if (manual && !this.updateAvailableDuringCheck && !this.data) {
            notification(
              t('notifications:updatesCheckComplete.title'),
              t('notifications:updatesCheckComplete.body'),
            );
          }
        },
        (error) => {
          this.checking = false;
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
