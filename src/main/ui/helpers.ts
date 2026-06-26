import { WebContents } from 'electron';
import path from 'path';
import { RENDERER_FOLDER } from '@/paths';
import { config } from '@/core/config';
import { DEFAULT_UI_THEME } from '~/constants';
import log from 'electron-log';

const scopeLog = log.scope('UIHelpers');

export async function loadPage(wc: WebContents, page: string, query: Record<string, string> = {}) {
  const finalQuery = {
    theme: config.getProperty('uiTheme') ?? DEFAULT_UI_THEME,
    ...query,
  };

  if (process.env.ELECTRON_RENDERER_URL) {
    const params = new URLSearchParams(finalQuery);
    const finalUrl = `${process.env.ELECTRON_RENDERER_URL}/${page}?${params.toString()}`;
    scopeLog.debug(`Loading page: ${finalUrl}`);
    await wc.loadURL(finalUrl).catch(() => {});
  } else {
    await wc
      .loadFile(path.join(RENDERER_FOLDER, page, 'index.html'), { query: finalQuery })
      .catch(() => {});
  }
}

export function openDevTools(wc: WebContents, expectedTarget: string) {
  const target = process.env.AB_DEVTOOLS;
  if (target === expectedTarget) {
    wc.openDevTools();
  }
}
