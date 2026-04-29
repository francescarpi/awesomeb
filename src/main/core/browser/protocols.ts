import { protocol } from 'electron';
import { partitions } from '@/core';
import path from 'path';
import fs from 'fs/promises';
import mimeTypes from 'mime-types';
import { INTERNAL_PROTOCOL, ALLOWED_PAGES } from '~/constants';

export function setupProtocols() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: INTERNAL_PROTOCOL,
      privileges: {
        secure: true,
        standard: true,
        allowServiceWorkers: false,
        bypassCSP: false,
        corsEnabled: true,
        supportFetchAPI: false,
        codeCache: true,
        stream: false,
      },
    },
  ]);
}

export function registerProtocols() {
  partitions.internal.ses.protocol.handle(INTERNAL_PROTOCOL, async (request) => {
    const url = new URL(request.url);
    const page = url.hostname;

    if (!ALLOWED_PAGES.includes(page)) {
      return new Response('', { status: 404 });
    }

    if (process.env.VITE_DEV_SERVER_URL) {
      let devServer: string;
      if (url.pathname === '/') {
        devServer = `${process.env.VITE_DEV_SERVER_URL}${page}`;
      } else {
        devServer = `${process.env.VITE_DEV_SERVER_URL}${url.pathname.substring(1)}${url.search}`;
      }
      return fetch(devServer);
    }

    let pathname = url.pathname;
    if (pathname === '/' || pathname === '') {
      pathname = `/${page}/index.html`;
    }

    const filePath = path.join(__dirname, '..', 'renderer', pathname);
    const data = await fs.readFile(filePath);
    const contentType = mimeTypes.lookup(filePath) || 'text/plain';

    return new Response(data, {
      headers: { 'content-type': contentType },
    });
  });
}
