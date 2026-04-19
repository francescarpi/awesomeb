import { app, Session as ElectronSession } from 'electron';
import { Session, Browser, registerSessionEvents, loadExtensionToSession } from '@/core';
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

  // ----------------------------------------------------------------------------------------------- //
  app.on('before-quit', async (event) => {
    event.preventDefault();

    const session = new Session(browser);
    session.save();

    for (const result of browser.tabs) {
      if (!result.tab.suspended) {
        result.tab.saveHistory();
      }
    }

    // TODO unload all extensions

    app.exit(0);
  });

  // ----------------------------------------------------------------------------------------------- //
  app.on('login', (event, webContents, _request, authInfo, callback) => {
    event.preventDefault();

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

  // ----------------------------------------------------------------------------------------------- //
  app.on('open-url', async (_event, url) => {
    browser.openURL(url);
  });

  // ----------------------------------------------------------------------------------------------- //
  app.on('session-created', async (ses: ElectronSession) => {
    registerSessionEvents(browser, ses);

    if (!ses.isPersistent()) {
      scopeLog.info('Non-persistent session created, skipping extension loading');
      return;
    }

    for (const extension of browser.extensions.active) {
      await loadExtensionToSession(ses, extension.id, extension.manifestPath);
    }
  });
}
