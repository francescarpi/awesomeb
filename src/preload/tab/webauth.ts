import { contextBridge, ipcRenderer } from 'electron';

export function iniWebAuth() {
  contextBridge.executeInMainWorld({
    func: (webauthGet: (options: PublicKeyCredentialRequestOptions) => Promise<void>) => {
      if (!navigator.credentials) {
        return;
      }

      navigator.credentials.create = async (_options: CredentialCreationOptions | undefined) => {
        // TODO implement create
        return null;
      };

      navigator.credentials.get = async (options: CredentialRequestOptions | undefined) => {
        if (!options) {
          return null;
        }

        const publicKey = options?.publicKey;
        if (!publicKey) {
          return null;
        }

        const result = await webauthGet(publicKey);
        console.log('webauth result', result);

        return null;
      };
    },
    args: [
      (publicKey: PublicKeyCredentialRequestOptions) =>
        ipcRenderer.invoke('webauth:get', publicKey),
    ],
  });
}
