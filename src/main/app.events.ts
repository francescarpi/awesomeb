import { app, autoUpdater, type AuthInfo, type WebContents } from 'electron';
import { Browser, clearExpiredClosedTabs, CLOSED_TABS_PURGE_INTERVAL_MS } from '@/core';
import { flushVisitHistory } from '@/core/visit-history/browser-hooks';
import log from 'electron-log';

const scopeLog = log.scope('AppEvents');

/** Callback provided by Electron to respond to an HTTP auth challenge. Calling
 * with no arguments cancels the request — the caller (e.g. an extension's
 * `fetch()`) will receive the 401 normally and can retry with its own
 * Authorization header or `onAuth` callback. */
export type LoginCallback = (username?: string, password?: string) => void;

/** Minimal shape of the auth event we care about. Kept narrow so the handler
 * can be unit-tested without spinning up a full Browser + Window + Modal. */
export interface LoginEventArgs {
  webContents: WebContents | null;
  authInfo: AuthInfo;
  callback: LoginCallback;
}

/** Handle an `app.on('login')` event for HTTP basic auth (401/407).
 *
 * Three branches:
 *
 * 1. **No `webContents`** — Electron fires this when the request originates
 *    from a utility process (Electron 33+ breaking change). We have no UI to
 *    attach the modal to, so we cancel the challenge and let the caller
 *    handle it.
 *
 * 2. **External `webContents`** — anything we did not create: MV3 service
 *    workers, MV2 background pages, extension popups, etc. These carry their
 *    own credentials in extension storage and rely on the normal 401 → retry
 *    flow (e.g. `isomorphic-git's onAuth`). If we opened the modal here we
 *    would (a) prompt the user when the extension already has credentials,
 *    and (b) silently swallow the callback so the request hangs forever
 *    when the webContents is not in our `_webContentsIndex`.
 *
 * 3. **Our own tab** — open the login modal and wire the callback so the
 *    user's input is forwarded to Chromium.
 */
export function handleLoginEvent(browser: Browser, args: LoginEventArgs): void {
  const { webContents, authInfo, callback } = args;

  if (!webContents) {
    scopeLog.error('Login event without webContents — cancelling');
    callback();
    return;
  }

  const result = browser.getTabByWebContentsId(webContents.id);
  if (!result) {
    scopeLog.debug(
      `Login event for external webContents id ${webContents.id} (${webContents.getType()}) — deferring to caller`,
      {
        url: webContents.getURL(),
        host: authInfo.host,
        realm: authInfo.realm,
      },
    );
    callback();
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
}

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
    handleLoginEvent(browser, { webContents, authInfo, callback });
  });
}
