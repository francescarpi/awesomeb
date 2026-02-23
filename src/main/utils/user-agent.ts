// import { app } from 'electron';
// import logger from 'electron-log';

// const scopeLog = logger.scope('UserAgent');

// const appName = app.getName();
// const appVersion = app.getVersion();

export function sanitizeUserAgent(userAgent: string, _url: URL): string {
  // let sanitizedUserAgent = userAgent.replace(/\sElectron\/\S+/, '').trim();
  //
  // const appNameVersion = `${appName}/${appVersion} `;
  // sanitizedUserAgent = sanitizedUserAgent.replace(appNameVersion, '').trim();

  // console.log(sanitizedUserAgent);

  // return sanitizedUserAgent;
  return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0';
  // return 'AwesomeB/0.0.1-alpha Chrome/144.0.7559.177';
  // return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0';
  // return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0';
}

// export function sanitizeUserAgent(ua: string, url: URL): string {
//   let sanitizedUserAgent = ua;
//
//   const isMicrosoftAuth =
//     url.hostname.includes('login.microsoftonline.com') ||
//     url.hostname.includes('login.live.com') ||
//     url.hostname.includes('oauth.live.com') ||
//     url.hostname.includes('onedrive.live.com') ||
//     url.hostname.includes('d.docs.live.net') ||
//     url.hostname.includes('graph.microsoft.com');
//
//   const isMicrosoftAccount = url.hostname === 'account.microsoft.com';
//
//   const removeAppName =
//     url.hostname.endsWith('.whatsapp.com') || url.hostname.endsWith('.microsoft.com');
//   const removeElectron = !isMicrosoftAuth || isMicrosoftAccount;
//
//   if (removeElectron) {
//     sanitizedUserAgent = ua.replace(/\sElectron\/\S+/, '').trim();
//   }
//
//   if (removeAppName) {
//     const name = app.getName();
//     const version = app.getVersion();
//     const appName = `${name}/${version} `;
//     sanitizedUserAgent = sanitizedUserAgent.replace(appName, '').trim();
//   }
//
//   if (process.env.LOGS_USER_AGENT === 'true') {
//     scopeLog.debug('================');
//     scopeLog.debug(`Host "${url?.hostname}"`);
//     scopeLog.debug(`Name removed: ${removeAppName ? 'Yes' : 'No'}`);
//     scopeLog.debug(`Electron removed: ${removeElectron ? 'Yes' : 'No'}`);
//     scopeLog.debug(`Sanitized: ${sanitizedUserAgent}`);
//     scopeLog.debug('----------------');
//   }
//
//   return sanitizedUserAgent;
// }
