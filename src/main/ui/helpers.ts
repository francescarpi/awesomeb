import { WebContents } from 'electron';
import path from 'path';
import { RENDERER_FOLDER } from '@/paths';
import { IMargin } from '~/types';
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

export function transformMargin(marginStr: string): IMargin {
  // Handle empty or whitespace-only strings
  if (!marginStr || !marginStr.trim()) {
    return {
      l: 0,
      r: 0,
      t: 0,
      b: 0,
    };
  }

  const margin = marginStr
    .trim()
    .split(/\s+/)
    .map((v) => {
      const parsed = parseInt(v, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

  // If no valid numbers found, return default
  if (margin.length === 0) {
    return {
      l: 0,
      r: 0,
      t: 0,
      b: 0,
    };
  }

  switch (margin.length) {
    case 1:
      return {
        l: margin[0],
        r: margin[0],
        t: margin[0],
        b: margin[0],
      };
    case 2:
      return {
        t: margin[0],
        b: margin[0],
        l: margin[1],
        r: margin[1],
      };
    case 3:
      return {
        t: margin[0],
        r: margin[1],
        l: margin[1],
        b: margin[2],
      };
    case 4:
    default:
      return {
        t: margin[0],
        r: margin[1] || margin[0],
        b: margin[2] || margin[0],
        l: margin[3] || margin[1] || margin[0],
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
