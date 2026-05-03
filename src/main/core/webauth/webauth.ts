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
    scopeLog.error('webauthn getCredential failed', result.errorObject);
    return result.error;
  }

  return result.data;
}
