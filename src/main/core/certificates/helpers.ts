import { type PeerCertificate, TLSSocket } from 'tls';
import * as https from 'https';

export async function getPeerCertificate(url: string): Promise<PeerCertificate | null> {
  if (!url.startsWith('https://')) {
    throw new Error('URL must start with https://');
  }

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const tlsSocket = res.socket as TLSSocket;
        const cert = tlsSocket.getPeerCertificate(true);

        if (!cert || Object.keys(cert).length === 0) {
          reject(null);
          return;
        }

        resolve(cert);
      })
      .on('error', reject);
  });
}
