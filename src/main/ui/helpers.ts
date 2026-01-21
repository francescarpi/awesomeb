import { app, WebContents } from 'electron';
import path from 'path';
import { RENDERER_FOLDER } from '@main/utils';

export async function loadPage(wc: WebContents, page: string, query: Record<string, string> = {}) {
  if (app.isPackaged) {
    await wc.loadFile(path.join(RENDERER_FOLDER, page, 'index.html'), { query });
  } else {
    const params = new URLSearchParams(query);
    await wc.loadURL(`http://localhost:4321/${page}?${params.toString()}`);
  }
}

export function openDevTools(wc: WebContents, expectedTarget: string) {
  const target = process.env.AB_DEVTOOLS;
  if (target === expectedTarget) {
    wc.openDevTools();
  }
}
