import { WebContents } from 'electron';
import path from 'path';
import { RENDERER_FOLDER } from '@/paths';
import { IMargins } from '~/types';
import { UILayout } from './layout';
import { UIView } from './view';
import { TViewId } from './types';

export async function loadPage(wc: WebContents, page: string, query: Record<string, string> = {}) {
  if (process.env.VITE_DEV_SERVER_URL) {
    const params = new URLSearchParams(query);
    await wc.loadURL(`${process.env.VITE_DEV_SERVER_URL}${page}?${params.toString()}`);
  } else {
    await wc.loadFile(path.join(RENDERER_FOLDER, page, 'index.html'), { query });
  }
}

export function openDevTools(wc: WebContents, expectedTarget: string) {
  const target = process.env.AB_DEVTOOLS;
  if (target === expectedTarget) {
    wc.openDevTools();
  }
}

export function transformMargin(margin: string): IMargins {
  const margins = margin.split(' ').map((v) => parseInt(v, 10));
  switch (margins.length) {
    case 1:
      return {
        l: margins[0],
        r: margins[0],
        t: margins[0],
        b: margins[0],
      };
    case 2:
      return {
        t: margins[0],
        b: margins[0],
        l: margins[1],
        r: margins[1],
      };
    case 3:
      return {
        t: margins[0],
        r: margins[1],
        l: margins[1],
        b: margins[2],
      };
    case 4:
      return {
        t: margins[0],
        r: margins[1],
        b: margins[2],
        l: margins[3],
      };
    default:
      return {
        l: 0,
        r: 0,
        t: 0,
        b: 0,
      };
  }
}

export function getOnlyViews(layout: UILayout, ignore: TViewId[]): UIView[] {
  const views: UIView[] = [];

  for (const child of layout.children) {
    if (child instanceof UIView && !ignore.includes(child.id)) {
      views.push(child);
    } else if (child instanceof UILayout) {
      views.push(...getOnlyViews(child, ignore));
    }
  }

  return views;
}
