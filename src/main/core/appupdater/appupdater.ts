import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { app } from 'electron';
import { Browser } from '@/core';
import { IAppUpdaterInfo } from '~/types';
import { removeAllAnchors } from './helpers';

const scopeLog = log.scope('AppUpdater');

export class AppUpdater {
  private data: IAppUpdaterInfo | null = null;

  constructor(private readonly browser: Browser) {
    log.transports.file.level = 'debug';
    autoUpdater.logger = scopeLog;
    autoUpdater.forceDevUpdateConfig = !app.isPackaged;
    autoUpdater.autoDownload = false;

    autoUpdater.on('update-available', (info) => {
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
      autoUpdater.checkForUpdates();
    }, 3000);
  }

  private emit() {
    this.browser.eventsChannel.emit('appupdater:version-available', this.data);
  }

  get versionAvailable(): IAppUpdaterInfo | null {
    return this.data;
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
