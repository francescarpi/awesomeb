import { app, autoUpdater } from 'electron';
import { Browser, clearExpiredClosedTabs, CLOSED_TABS_PURGE_INTERVAL_MS } from '@/core';
import { flushVisitHistory } from '@/core/visit-history/browser-hooks';
import log from 'electron-log';

const scopeLog = log.scope('AppEvents');

/** Handle for the periodic closed-tabs retention purge. Cleared on before-quit
 * so the interval does not outlive the process and hold a closure over the
 * Browser past the user's intent to exit. */
let closedTabsPurgeInterval: NodeJS.Timeout | null = null;

/** Schedule the closed-tabs retention purge: a one-shot 5s run plus a
 * recurring interval. Call from app.whenReady() after Browser is initialized. */
export function startClosedTabsPurge(browser: Browser): void {
  setTimeout(() => clearExpiredClosedTabs(browser), 5000);
  closedTabsPurgeInterval = setInterval(
    () => clearExpiredClosedTabs(browser),
    CLOSED_TABS_PURGE_INTERVAL_MS,
  );
}

function stopClosedTabsPurge(): void {
  if (closedTabsPurgeInterval !== null) {
    clearInterval(closedTabsPurgeInterval);
    closedTabsPurgeInterval = null;
  }
}

export function registerAppEvents(browser: Browser) {
  scopeLog.debug('Registering app events');

  //--------------------------------------------------------------------------------------
  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
      app.quit();
    }
  });

  //--------------------------------------------------------------------------------------
  app.on('before-quit', async (event) => {
    event.preventDefault();

    stopClosedTabsPurge();

    for (const window of browser.windows) {
      window.modal.open('quitting');
    }

    setTimeout(async () => {
      flushVisitHistory();
      browser.saveSession();

      const extensions = browser.extensions.active;
      for (const extension of extensions) {
        await browser.extensions.loadUnloadExtensionToAllSessions(extension.id, 'unload');
      }

      app.exit(0);
    }, 200);
  });

  //--------------------------------------------------------------------------------------
  autoUpdater.on('before-quit-for-update', () => {
    browser.saveSession();
  });

  //--------------------------------------------------------------------------------------
  app.on('login', (event, webContents, _request, authInfo, callback) => {
    event.preventDefault();

    if (!webContents) {
      scopeLog.error('No webcontents found');
      return;
    }

    const result = browser.getTabByWebContentsId(webContents.id);
    if (!result) {
      scopeLog.warn(`Login event for unknown webContents id: ${webContents.id}`);
      return;
    }

    result.tab.setBasicAuthCallback(callback);
    result.window.modal.open('login', {
      query: {
        host: authInfo.host,
        realm: authInfo.realm,
        winId: result.window.id.toString(),
        tabId: result.tab.id.toString(),
      },
    });
  });
}
