import { getCredential } from 'electron-webauthn';
import log from 'electron-log';
import { type IpcMainInvokeEvent } from 'electron';
import type { IWinDesConTab } from '~/types';
import { parse } from 'tldts';

const scopeLog = log.scope('Webauth');

export async function webauthGet(
  event: IpcMainInvokeEvent,
  tabData: IWinDesConTab,
  publicKey: PublicKeyCredentialRequestOptions,
) {
  const currentOrigin = event.senderFrame?.origin || '';
  const topFrameOrigin = event.senderFrame?.top?.origin;

  const result = await getCredential(publicKey, {
    currentOrigin,
    topFrameOrigin: topFrameOrigin === currentOrigin ? undefined : topFrameOrigin,
    isPublicSuffix: (domain: string) => {
      const result = parse(domain, { allowPrivateDomains: false });
      return result.domain === null;
    },
    nativeWindowHandle: tabData.window.bw.getNativeWindowHandle(),
  });

  if (!result.success) {
    switch (result.error) {
      case 'TypeError':
        scopeLog.error('Invalid parameters provided');
        break;
      case 'NotAllowedError':
        scopeLog.error('User cancelled or operation not allowed');
        break;
      case 'SecurityError':
        scopeLog.error('Origin or rpId validation failed');
        break;
      case 'AbortError':
        scopeLog.error('Operation was aborted');
        break;
    }
    return null;
  }

  return result.data;
}
