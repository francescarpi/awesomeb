import { autoUpdater } from 'electron-updater';
import { autoUpdater as electronAutoUpdater } from 'electron';
import log from 'electron-log';
import { app } from 'electron';
import { Browser } from '@/core';
import { IAppUpdaterInfo } from '~/types';
import { removeAllAnchors } from './helpers';
import { quitAndSave } from '../../app.events';

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

    // `before-quit-for-update` fires on `electron.autoUpdater` (built-in),
    // emitted by electron-updater's BaseUpdater BEFORE windows close on quitAndInstall.
    // We persist the session here so a restart after update restores tabs.
    electronAutoUpdater.on('before-quit-for-update', async () => {
      await quitAndSave(this.browser);
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
