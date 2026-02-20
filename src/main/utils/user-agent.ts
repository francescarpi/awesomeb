// import { app } from 'electron';

// const appName = app.getName();
// const appVersion = app.getVersion();

export function sanitizeUserAgent(userAgent: string, _url: URL): string {
  const sanitizedUserAgent = userAgent.replace(/\sElectron\/\S+/, '').trim();

  // const appNameVersion = `${appName}/${appVersion} `;
  // sanitizedUserAgent = sanitizedUserAgent.replace(appNameVersion, '').trim();

  // console.log(sanitizedUserAgent);

  return sanitizedUserAgent;
}
