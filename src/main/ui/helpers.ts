import { WebContents } from 'electron';
import path from 'path';
import { RENDERER_FOLDER } from '@/paths';

export async function loadPage(wc: WebContents, page: string, query: Record<string, string> = {}) {
  if (process.env.VITE_DEV_SERVER_URL) {
    const params = new URLSearchParams(query);
    await wc
      .loadURL(`${process.env.VITE_DEV_SERVER_URL}${page}?${params.toString()}`)
      .catch(() => {});
  } else {
    await wc.loadFile(path.join(RENDERER_FOLDER, page, 'index.html'), { query }).catch(() => {});
  }
}

export function openDevTools(wc: WebContents, expectedTarget: string) {
  const target = process.env.AB_DEVTOOLS;
  if (target === expectedTarget) {
    wc.openDevTools();
  }
}
