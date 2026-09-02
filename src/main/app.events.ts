import { app, autoUpdater } from 'electron';
import { Browser } from '@/core';
import log from 'electron-log';

const scopeLog = log.scope('AppEvents');

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

    for (const window of browser.windows) {
      window.modal.open('quitting');
    }

    setTimeout(async () => {
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

  //--------------------------------------------------------------------------------------
  app.on('open-url', async (_event, url) => {
    const result = await browser.openURL(url, { selectTab: true });
    result?.window.focus();
  });
}
