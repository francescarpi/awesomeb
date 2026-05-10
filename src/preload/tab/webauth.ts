import { contextBridge, ipcRenderer } from 'electron';

export function iniWebAuth() {
  contextBridge.executeInMainWorld({
    func: (
      webauthGet: (options: SerializedGetOptions) => Promise<GetCredentialData | null>,
      webauthCreate: (options: SerializedCreateOptions) => Promise<CreateCredentialData | null>,
    ) => {
      if (!navigator.credentials) {
        return;
      }

      function toBase64(value: BufferSource): string {
        const bytes =
          value instanceof ArrayBuffer
            ? new Uint8Array(value)
            : new Uint8Array(
                (value as ArrayBufferView).buffer,
                (value as ArrayBufferView).byteOffset,
                (value as ArrayBufferView).byteLength,
              );
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }

      function base64ToBuffer(b64: string): ArrayBuffer {
        const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
      }

      navigator.credentials.get = async (options: CredentialRequestOptions | undefined) => {
        if (!options?.publicKey) return null;

        const pk = options.publicKey;
        const serialized: SerializedGetOptions = {
          ...pk,
          challenge: toBase64(pk.challenge),
          allowCredentials: pk.allowCredentials?.map((c) => ({
            ...c,
            id: toBase64(c.id),
          })),
        };

        const data = await webauthGet(serialized);
        if (!data) return null;

        return {
          id: data.credentialId,
          rawId: base64ToBuffer(data.credentialId),
          type: 'public-key' as const,
          authenticatorAttachment: null,
          getClientExtensionResults: () => ({}),
          response: {
            clientDataJSON: base64ToBuffer(data.clientDataJSON),
            authenticatorData: base64ToBuffer(data.authenticatorData),
            signature: base64ToBuffer(data.signature),
            userHandle: data.userHandle ? base64ToBuffer(data.userHandle) : null,
          },
        } as unknown as PublicKeyCredential;
      };

      navigator.credentials.create = async (options: CredentialCreationOptions | undefined) => {
        if (!options?.publicKey) return null;

        const pk = options.publicKey;
        const serialized: SerializedCreateOptions = {
          ...pk,
          challenge: toBase64(pk.challenge),
          user: { ...pk.user, id: toBase64(pk.user.id) },
          excludeCredentials: pk.excludeCredentials?.map((c) => ({
            ...c,
            id: toBase64(c.id),
          })),
        };

        const data = await webauthCreate(serialized);
        if (!data) return null;

        return {
          id: data.credentialId,
          rawId: base64ToBuffer(data.credentialId),
          type: 'public-key' as const,
          authenticatorAttachment: null,
          getClientExtensionResults: () => data.extensions ?? {},
          response: {
            clientDataJSON: base64ToBuffer(data.clientDataJSON),
            attestationObject: base64ToBuffer(data.attestationObject),
            getAuthenticatorData: () => base64ToBuffer(data.authData),
            getPublicKey: () => base64ToBuffer(data.publicKey),
            getPublicKeyAlgorithm: () => data.publicKeyAlgorithm,
            getTransports: () => data.transports,
          },
        } as unknown as PublicKeyCredential;
      };
    },
    args: [
      (options: SerializedGetOptions) => ipcRenderer.invoke('webauth:get', { publicKey: options }),
      (options: SerializedCreateOptions) =>
        ipcRenderer.invoke('webauth:create', { publicKey: options }),
    ],
  });
}

// All BufferSource fields replaced by base64 strings (safe across contextBridge + IPC)
type SerializedGetOptions = Omit<
  PublicKeyCredentialRequestOptions,
  'challenge' | 'allowCredentials'
> & {
  challenge: string;
  allowCredentials?: (Omit<PublicKeyCredentialDescriptor, 'id'> & { id: string })[];
};

type SerializedCreateOptions = Omit<
  PublicKeyCredentialCreationOptions,
  'challenge' | 'user' | 'excludeCredentials'
> & {
  challenge: string;
  user: Omit<PublicKeyCredentialUserEntity, 'id'> & { id: string };
  excludeCredentials?: (Omit<PublicKeyCredentialDescriptor, 'id'> & { id: string })[];
};

type GetCredentialData = {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
};

type CreateCredentialData = {
  credentialId: string;
  clientDataJSON: string;
  attestationObject: string;
  authData: string;
  publicKey: string;
  publicKeyAlgorithm: number;
  transports: string[];
  extensions: Record<string, unknown>;
};
