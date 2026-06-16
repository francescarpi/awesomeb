import { app } from 'electron';
import { Session, Browser } from '@/core';
import log from 'electron-log';

const scopeLog = log.scope('AppEvents');

let isQuitting = false;

export async function performQuitSequence(browser: Browser): Promise<void> {
  for (const window of browser.windows) {
    window.modal.open('quitting');
  }

  const session = new Session(browser);
  await session.save();

  for (const result of browser.tabs) {
    if (result.tab.suspended || result.tab.partition.private) {
      continue;
    }
    result.tab.saveHistory();
  }

  const extensions = browser.extensions.active;
  for (const extension of extensions) {
    await browser.extensions.loadUnloadExtensionToAllSessions(extension.id, 'unload');
  }
}

export async function quitAndSave(browser: Browser): Promise<void> {
  if (isQuitting) return;
  isQuitting = true;
  try {
    await performQuitSequence(browser);
  } finally {
    app.exit(0);
  }
}

export function registerAppEvents(browser: Browser) {
  scopeLog.debug('Registering app events');

  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', async (event) => {
    event.preventDefault();
    await quitAndSave(browser);
  });

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

  app.on('open-url', async (_event, url) => {
    const result = await browser.openURL(url, { selectTab: true });
    result?.window.focus();
  });
}
