import { getCredential, createCredential } from 'electron-webauthn';
import log from 'electron-log';
import { type IpcMainInvokeEvent } from 'electron';
import type { IWinDesConTab } from '~/types';
import { parse } from 'tldts';

const scopeLog = log.scope('Webauth');

function getOrigins(event: IpcMainInvokeEvent) {
  const currentOrigin = event.senderFrame?.origin || '';
  const topFrameOrigin = event.senderFrame?.top?.origin;
  return {
    currentOrigin,
    topFrameOrigin: topFrameOrigin === currentOrigin ? undefined : topFrameOrigin,
  };
}

function isPublicSuffix(domain: string) {
  return parse(domain, { allowPrivateDomains: false }).domain === null;
}

function b64(s: string): ArrayBuffer {
  const buf = Buffer.from(s, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

// The preload serializes all BufferSource fields to base64 strings to survive
// contextBridge + IPC serialization. We reconstruct them here as Buffer.
export type SerializedGetOptions = Omit<
  PublicKeyCredentialRequestOptions,
  'challenge' | 'allowCredentials'
> & {
  challenge: string;
  allowCredentials?: (Omit<PublicKeyCredentialDescriptor, 'id'> & { id: string })[];
};

export type SerializedCreateOptions = Omit<
  PublicKeyCredentialCreationOptions,
  'challenge' | 'user' | 'excludeCredentials'
> & {
  challenge: string;
  user: Omit<PublicKeyCredentialUserEntity, 'id'> & { id: string };
  excludeCredentials?: (Omit<PublicKeyCredentialDescriptor, 'id'> & { id: string })[];
};

function deserializeGetOptions(
  serialized: SerializedGetOptions,
): PublicKeyCredentialRequestOptions {
  return {
    ...serialized,
    challenge: b64(serialized.challenge),
    allowCredentials: serialized.allowCredentials?.map((c) => ({ ...c, id: b64(c.id) })),
  };
}

function deserializeCreateOptions(
  serialized: SerializedCreateOptions,
): PublicKeyCredentialCreationOptions {
  return {
    ...serialized,
    challenge: b64(serialized.challenge),
    user: { ...serialized.user, id: b64(serialized.user.id) },
    excludeCredentials: serialized.excludeCredentials?.map((c) => ({ ...c, id: b64(c.id) })),
  };
}

export async function webauthGet(
  event: IpcMainInvokeEvent,
  tabData: IWinDesConTab,
  serialized: SerializedGetOptions,
) {
  const result = await getCredential(deserializeGetOptions(serialized), {
    ...getOrigins(event),
    isPublicSuffix,
    nativeWindowHandle: tabData.window.bw.getNativeWindowHandle(),
  });

  if (!result.success) {
    scopeLog.error('webauthn getCredential failed', result.errorObject);
    return result.error;
  }

  return result.data;
}

export async function webauthCreate(
  event: IpcMainInvokeEvent,
  tabData: IWinDesConTab,
  serialized: SerializedCreateOptions,
) {
  const result = await createCredential(deserializeCreateOptions(serialized), {
    ...getOrigins(event),
    isPublicSuffix,
    nativeWindowHandle: tabData.window.bw.getNativeWindowHandle(),
  });

  if (!result.success) {
    scopeLog.error('webauthn createCredential failed', result.errorObject);
    return result.error;
  }

  return result.data;
}
