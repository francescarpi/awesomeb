import { Browser, getPeerCertificate, Window } from '@/core';
import { createHandler, windowChecker, modalChecker } from '@/utils';
import log from 'electron-log';

const scopeLog = log.scope('CertificatesIPC');

export function setupCertificatesIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'certificates:info',
    'handle',
    browser,
    [windowChecker, modalChecker],
    async ({ win }) => {
      const tabData = win.selectedTab;
      if (!tabData || !tabData.tab.safe || !tabData.tab.url) {
        scopeLog.warn('No valid tab selected for certificate info');
        return null;
      }

      try {
        const info = await getPeerCertificate(tabData.tab.url);
        return info;
      } catch (error) {
        scopeLog.error(`Error fetching certificate info for URL ${tabData.tab.url}:`, error);
        return null;
      }
    },
  );
}
