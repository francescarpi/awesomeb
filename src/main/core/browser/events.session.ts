import { Browser } from '@/core';
import { TPartitionId } from '~/types';
import { session, desktopCapturer } from 'electron';
import { sanitizeUserAgent } from '@/utils';

export function registerSessionEvents(_browser: Browser, partitionId: TPartitionId) {
  const ses = session.fromPartition(partitionId);

  // ----------------------------------------------------------------------------------------------- //
  ses.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      desktopCapturer.getSources({ types: ['window', 'screen'] }).then((sources) => {
        callback({ video: sources[0], audio: 'loopback' });
      });
    },
    { useSystemPicker: true },
  );

  // ----------------------------------------------------------------------------------------------- //
  ses.webRequest.onBeforeSendHeaders({ urls: ['<all_urls>'] }, (details, callback) => {
    const newHeaders = { ...details.requestHeaders };
    const uaKey = Object.keys(newHeaders).find((key) => key.toLowerCase() === 'user-agent');

    if (!uaKey) {
      callback({});
      return;
    }

    const userAgent = newHeaders[uaKey];
    if (!userAgent) {
      callback({});
      return;
    }

    newHeaders[uaKey] = sanitizeUserAgent(userAgent, new URL(details.url));

    callback({ requestHeaders: newHeaders });
  });
}
