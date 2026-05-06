import { Browser } from '@/core';
import log from 'electron-log';
import { webauthGet } from './webauth';
import { createHandler } from '@/utils';
import { type IpcMainInvokeEvent } from 'electron';

const scopeLog = log.scope('WebauthIPC');

export function setupWebauthIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ event: IpcMainInvokeEvent; publicKey: PublicKeyCredentialRequestOptions }>(
    'webauth:get',
    'handle',
    browser,
    [],
    async ({ event, publicKey }) => {
      const tabData = browser.getTabByWebContentsId(event.sender.id);
      if (!tabData) {
        scopeLog.warn('webauth:get called from unknown webContents');
        return null;
      }

      const result = await webauthGet(event, tabData, publicKey);
      return result;
    },
  );
}
