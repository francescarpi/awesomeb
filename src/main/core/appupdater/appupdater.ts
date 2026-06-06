import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { app } from 'electron';
import { Browser } from '@/core';

const scopeLog = log.scope('AppUpdater');

export class AppUpdater {
  private _versionAvailable: string | null = null;

  constructor(browser: Browser) {
    log.transports.file.level = 'debug';
    autoUpdater.logger = scopeLog;
    autoUpdater.forceDevUpdateConfig = !app.isPackaged;
    autoUpdater.checkForUpdates();
    autoUpdater.on('update-downloaded', (info) => {
      this._versionAvailable = info.version;
      browser.eventsChannel.emit('appupdater:version-available', info.version);
    });
  }

  get versionAvailable() {
    return this._versionAvailable;
  }
}
