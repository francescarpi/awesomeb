#!/usr/bin/env node
// Fetch the latest AwesomeB release metadata from the GitHub API
// and write it to docs/src/data/latest-release.json so Astro components
// can import it at build time. This file is generated and gitignored.
//
// Usage:
//   node docs/scripts/fetch-latest-release.mjs
//
// Exits 0 even if the fetch fails, because the docs site must still
// build (with the previous data, or a fallback that points to the
// releases page on GitHub). Only non-recoverable I/O errors exit 1.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = resolve(__dirname, '..');
const OUTPUT = join(DOCS_ROOT, 'src/data/latest-release.json');

const REPO = 'francescarpi/awesomeb';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases`;
const USER_AGENT = 'awesomeb-docs-build';

const FALLBACK = {
  version: '',
  tag: '',
  html_url: RELEASES_PAGE,
  fetched_at: null,
  error: 'not_fetched',
  mac: null,
  linux: null,
  windows: null,
};

function round1(n) {
  return Math.round(n * 10) / 10;
}

function pickMac(assets) {
  const dmg = assets.find((a) => a.name.endsWith('.dmg'));
  if (!dmg) return null;
  return {
    url: dmg.browser_download_url,
    filename: dmg.name,
    size_mb: round1(dmg.size / 1024 / 1024),
  };
}

function pickLinux(assets) {
  const appImage = assets.find((a) => a.name.endsWith('.AppImage'));
  if (!appImage) return null;
  return {
    url: appImage.browser_download_url,
    filename: appImage.name,
    size_mb: round1(appImage.size / 1024 / 1024),
  };
}

function pickWindows(assets) {
  const exe = assets.find((a) => a.name.endsWith('.exe') && !a.name.endsWith('.blockmap'));
  if (!exe) return null;
  return {
    url: exe.browser_download_url,
    filename: exe.name,
    size_mb: round1(exe.size / 1024 / 1024),
  };
}

async function readPrevious() {
  try {
    const raw = await readFile(OUTPUT, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJson(payload) {
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

async function main() {
  let payload;
  try {
    const res = await fetch(API_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    payload = await res.json();
  } catch (err) {
    const reason = `fetch_failed: ${err instanceof Error ? err.message : String(err)}`;
    console.warn(`[fetch-latest-release] ${reason}`);
    const previous = await readPrevious();
    const fallback = previous
      ? { ...FALLBACK, ...previous, fetched_at: null, error: reason }
      : { ...FALLBACK, error: reason };
    await writeJson(fallback);
    return;
  }

  if (!payload || !payload.tag_name || payload.message === 'Not Found') {
    const reason = 'no_release_found';
    console.warn(`[fetch-latest-release] ${reason}`);
    const previous = await readPrevious();
    const fallback = previous
      ? { ...FALLBACK, ...previous, fetched_at: null, error: reason }
      : { ...FALLBACK, error: reason };
    await writeJson(fallback);
    return;
  }

  const assets = (payload.assets || []).filter(
    (a) => a && a.state === 'uploaded' && !a.name.endsWith('.blockmap') && !a.name.endsWith('.yml'),
  );

  const out = {
    version: (payload.name || payload.tag_name || '').replace(/^v/, ''),
    tag: payload.tag_name,
    html_url: payload.html_url || RELEASES_PAGE,
    fetched_at: new Date().toISOString(),
    error: null,
    mac: pickMac(assets),
    linux: pickLinux(assets),
    windows: pickWindows(assets),
  };

  await writeJson(out);
  console.log(
    `[fetch-latest-release] Wrote ${OUTPUT} (version=${out.version}, mac=${!!out.mac}, linux=${!!out.linux}, windows=${!!out.windows})`,
  );
}

main().catch((err) => {
  console.error('[fetch-latest-release] Unexpected error:', err);
  process.exit(1);
});
