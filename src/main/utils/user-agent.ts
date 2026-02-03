import { app } from 'electron';

const appName = app.getName();
const appVersion = app.getVersion();

export function sanitizeUserAgent(userAgent: string, _url: URL): string {
  let sanitizedUserAgent = userAgent.replace(/\sElectron\/\S+/, '').trim();

  const appNameVersion = `${appName}/${appVersion} `;
  sanitizedUserAgent = sanitizedUserAgent.replace(appNameVersion, '').trim();

  return sanitizedUserAgent;
}
