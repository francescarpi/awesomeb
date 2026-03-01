import { Browser, getPeerCertificate } from '@/core';
import { checkModalSender } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('CertificatesIPC');

export function setupCertificatesIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('certificates:info', async (event, winId: TWindowId) => {
    scopeLog.info(`Received 'certificates:info' IPC from window ID ${winId}`);
    return await checkModalSender(event, browser, winId, async (window) => {
      const tabData = window.selectedTab;
      if (!tabData || !tabData.tab.safe || !tabData.tab.url) {
        scopeLog.warn('No valid tab selected for certificate info');
        return null;
      }

      const info = await getPeerCertificate(tabData.tab.url);
      return info;
    });
  });
}
