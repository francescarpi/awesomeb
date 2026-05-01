import { Browser } from '@/core';
import log from 'electron-log';
import { ipcMain } from 'electron';
import { webauthGet } from './webauth';

const scopeLog = log.scope('WebauthIPC');

export function setupWebauthIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('webauth:get', async (event, publicKey: PublicKeyCredentialRequestOptions) => {
    scopeLog.debug('webauth:get received');
    if (process.platform !== 'darwin') {
      scopeLog.warn('webauth:get is only supported on macOS');
      return null;
    }

    const tabData = browser.getTabByWebContentsId(event.sender.id);
    if (!tabData) {
      scopeLog.warn('webauth:get called from unknown webContents');
      return null;
    }

    const result = await webauthGet(event, tabData, publicKey);
    return result;
  });
}
