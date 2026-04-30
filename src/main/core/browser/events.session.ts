import { ALLOWED_PERMISSIONS, Browser, config, permissions } from '@/core';
import { EDownloadStatus } from '~/types';
import { desktopCapturer, Session } from 'electron';
import { sanitizeUserAgent } from '@/utils';
import log from 'electron-log';
import path from 'path';
import fs from 'fs';

const scopeLog = log.scope('SessionEvents');

export function registerSessionEvents(browser: Browser, ses: Session) {
  // ----------------------------------------------------------------------------------------------- //
  ses.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      desktopCapturer.getSources({ types: ['window', 'screen'] }).then((sources) => {
        callback({ video: sources[0], audio: 'loopback' });
      });
    },
    { useSystemPicker: true },
  );

  // ----------------------------------------------------------------------------------------------- //
  ses.webRequest.onBeforeSendHeaders({ urls: ['<all_urls>'] }, (details, callback) => {
    const newHeaders = { ...details.requestHeaders };
    const uaKey = Object.keys(newHeaders).find((key) => key.toLowerCase() === 'user-agent');

    if (!uaKey) {
      scopeLog.warn('User-Agent header not found in request headers:', details.requestHeaders);
      callback({});
      return;
    }

    const userAgent = newHeaders[uaKey];
    if (!userAgent) {
      scopeLog.warn('User-Agent header is empty:', details.requestHeaders);
      callback({});
      return;
    }

    newHeaders[uaKey] = sanitizeUserAgent(userAgent, new URL(details.url));

    callback({ requestHeaders: newHeaders });
  });

  // ----------------------------------------------------------------------------------------------- //
  ses.on('will-download', async (_event, item, wc) => {
    const tabData = browser.getTabByWebContentsId(wc.id);
    if (!tabData) {
      scopeLog.error(`Tab not found for WebContents ID ${wc.id} during will-download.`);
      return;
    }

    scopeLog.info(`Download: ${item.getFilename()} from tab: ${tabData.tab.id}`);

    const downloadsFolder = config.getProperty('downloadsFolder');
    const filePath = path.join(downloadsFolder, item.getFilename());

    // Check if file already exists and modify the filename if necessary adding a number suffix
    let savePath = filePath;
    let fileIndex = 1;
    const fileExtension = path.extname(item.getFilename());
    const fileNameWithoutExt = path.basename(item.getFilename(), fileExtension);

    while (fs.existsSync(savePath)) {
      savePath = path.join(downloadsFolder, `${fileNameWithoutExt} (${fileIndex})${fileExtension}`);
      fileIndex++;
    }

    item.setSavePath(savePath);

    browser.downloads.add(item);

    item.on('updated', (_event, state) => {
      const download = browser.downloads.get(savePath);
      if (!download) {
        scopeLog.error(
          `FromSessionEvents: Download not found in browser for path ${savePath} during update.`,
        );
        return;
      }

      if (download.status === EDownloadStatus.Paused && !item.isPaused()) {
        scopeLog.info(`Download resumed: ${item.getFilename()}`);
        download.setStatus(EDownloadStatus.InProgress);
      }

      if (download.status === EDownloadStatus.Idle) {
        download.setStatus(EDownloadStatus.InProgress);
      }

      if (state === 'interrupted') {
        scopeLog.warn(`Download interrupted: ${item.getFilename()}`);
        download.setStatus(EDownloadStatus.Interrupted);
        return;
      }

      if (item.isPaused()) {
        scopeLog.info(`Download paused: ${item.getFilename()}`);
        download.setStatus(EDownloadStatus.Paused);
        return;
      }

      download.setReceivedBytes(item.getReceivedBytes());
    });

    item.on('done', (_event, state) => {
      const download = browser.downloads.get(savePath);
      if (!download) {
        scopeLog.error(
          `FromSessionEvents: Download not found in browser for path ${savePath} during update.`,
        );
        return;
      }

      switch (state) {
        case 'completed':
          download.setStatus(EDownloadStatus.Completed);
          return;
        case 'interrupted':
          download.setStatus(EDownloadStatus.Interrupted);
          return;
        case 'cancelled':
          download.setStatus(EDownloadStatus.Cancelled);
          return;
      }
    });
  });

  // ----------------------------------------------------------------------------------------------- //
  ses.setPermissionRequestHandler(async (webContents, permission, callback) => {
    if (config.isStandardPermissions && ALLOWED_PERMISSIONS.includes(permission)) {
      scopeLog.info(`Automatically granting standard permission: ${permission}`);
      callback(true);
      return;
    }

    const tabResult = browser.getTabByWebContentsId(webContents.id);
    if (!tabResult) {
      scopeLog.error(
        `Tab not found for WebContents ID ${webContents.id} during permission request.`,
      );
      callback(false);
      return;
    }

    const url = webContents.getURL();
    if (!url) {
      scopeLog.error('URL not found for WebContents during permission request.');
      callback(false);
      return;
    }

    let host: string;

    try {
      host = new URL(url).host;
    } catch {
      scopeLog.error(`Invalid URL "${url}" for permission request.`);
      callback(false);
      return;
    }

    const permissionValue = permissions.get(host, permission);

    scopeLog.info(
      `Permission request: host=${host}, permission=${permission}, storedValue=${permissionValue}`,
    );

    if (permissionValue !== null) {
      callback(permissionValue);
      return;
    }

    const selectedTab = browser.selectedTab;
    if (selectedTab && selectedTab.desktop.id !== tabResult.desktop.id) {
      tabResult.window.selectTab(tabResult.tab.id);
    }

    tabResult.tab.setRequestPermission([permission, host, callback]);

    tabResult.window.modal.open('request-permission', {
      query: {
        permission,
        host,
        url,
        tabId: tabResult.tab.id.toString(),
      },
    });
  });
}
