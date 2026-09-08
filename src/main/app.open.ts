import { app } from 'electron';
import { Browser, filePathToURL } from '@/core';
import { existsSync, statSync } from 'node:fs';
import log from 'electron-log';

const scopeLog = log.scope('AppOpen');

let pending: string[] = [];
let browserRef: Browser | null = null;

function openUrlAndFocus(browser: Browser, url: string): void {
  browser.openURL(url, { selectTab: true }).then((result) => {
    result?.window.focus();
  });
}

function enqueue(url: string): void {
  if (browserRef) {
    openUrlAndFocus(browserRef, url);
  } else {
    pending.push(url);
  }
}

function isDirectory(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function toOpenableURL(input: string): string | null {
  if (!input || input.trim() === '') {
    return null;
  }

  const trimmed = input.trim();

  // Flags and internal command-line switches are never user content.
  if (trimmed.startsWith('-')) {
    return null;
  }

  // Already a real URL (http(s), file, internal protocol) -> use as-is.
  if (/^(https?:|file:|ab:)\/\//i.test(trimmed)) {
    return trimmed;
  }

  // A real file on disk -> convert to a file:// URL.
  if (existsSync(trimmed) && !isDirectory(trimmed)) {
    return filePathToURL(trimmed);
  }

  return null;
}

function collectOpenableArgs(argv: string[]): string[] {
  const urls: string[] = [];

  for (const arg of argv) {
    const url = toOpenableURL(arg);
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Registers the external-entry handlers (open-url, open-file, second-instance).
 * Call this EARLY, before app.whenReady(), so that URLs/files delivered while
 * the app is still booting (e.g. opening a local .html with the app closed)
 * are captured instead of lost. Values received before the browser exists are
 * buffered and drained by attachOpenURL().
 */
export function registerOpenHandlers(): void {
  app.on('open-url', (event, url) => {
    event.preventDefault();
    enqueue(url);
  });

  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    const url = filePathToURL(filePath);
    if (!url) {
      scopeLog.error(`Invalid file path received: ${filePath}`);
      return;
    }
    enqueue(url);
  });

  app.on('second-instance', (_event, argv) => {
    for (const url of collectOpenableArgs(argv)) {
      enqueue(url);
    }
  });
}

/**
 * Binds the backing browser and drains any buffered URLs/files captured while
 * the app was booting. Call once the browser is fully set up and the session
 * has been loaded.
 */
export function attachOpenURL(browser: Browser): void {
  browserRef = browser;

  const toOpen = pending;
  pending = [];
  for (const url of toOpen) {
    openUrlAndFocus(browser, url);
  }
}

/**
 * Forgets any externally submitted URLs that will not be opened (e.g. when the
 * welcome flow takes priority over early external entry points).
 */
export function discardPendingOpenURLs(): void {
  pending = [];
}
