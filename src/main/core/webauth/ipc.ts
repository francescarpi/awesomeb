import { Browser } from '@/core';
import log from 'electron-log';
import {
  webauthGet,
  webauthCreate,
  type SerializedGetOptions,
  type SerializedCreateOptions,
} from './webauth';
import { createHandler } from '@/utils';
import { type IpcMainInvokeEvent } from 'electron';

const scopeLog = log.scope('WebauthIPC');

export function setupWebauthIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ event: IpcMainInvokeEvent; publicKey: SerializedGetOptions }>(
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

      return webauthGet(event, tabData, publicKey);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ event: IpcMainInvokeEvent; publicKey: SerializedCreateOptions }>(
    'webauth:create',
    'handle',
    browser,
    [],
    async ({ event, publicKey }) => {
      const tabData = browser.getTabByWebContentsId(event.sender.id);
      if (!tabData) {
        scopeLog.warn('webauth:create called from unknown webContents');
        return null;
      }

      return webauthCreate(event, tabData, publicKey);
    },
  );
}
