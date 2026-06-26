import { describe, expect, test, beforeEach } from 'vitest';
import type { IpcMainInvokeEvent } from 'electron';
import { Browser, WelcomeWindow } from '@/core';
import { welcomeWindowChecker } from './ipc';

function makeEvent(url: string, id: number): IpcMainInvokeEvent {
  return { sender: { getURL: () => url, id } } as unknown as IpcMainInvokeEvent;
}

function fakeWelcomeWindow(id: number): WelcomeWindow {
  return { webContentsID: id } as unknown as WelcomeWindow;
}

describe('welcomeWindowChecker', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
  });

  describe('accepted welcome URLs', () => {
    // Production loads the welcome page via loadFile, which yields a file:// URL
    // pointing at the absolute path on disk. The pathname always ends with
    // /welcome/index.html.
    // Dev (Astro) returns http://localhost:4321/welcome?theme=... with no
    // trailing slash on the path; the pathname is just /welcome.
    test.each([
      [
        'production: file:// with full path and query',
        'file:///Users/me/app/dist-electron/renderer/welcome/index.html?theme=cupcake',
      ],
      [
        'production: file:// with full path, no query',
        'file:///Users/me/app/dist-electron/renderer/welcome/index.html',
      ],
      ['dev: http with no trailing slash and query', 'http://localhost:4321/welcome?theme=cupcake'],
      ['dev: http with trailing slash and query', 'http://localhost:4321/welcome/?theme=cupcake'],
      ['dev: http with trailing slash, no query', 'http://localhost:4321/welcome/'],
      ['dev: http, no query, no trailing slash', 'http://localhost:4321/welcome'],
    ])('accepts %s', (_label, url) => {
      const win = fakeWelcomeWindow(42);
      browser.setWelcomeWindow(win);

      const result = welcomeWindowChecker(browser, makeEvent(url, 42), {});

      expect(result).not.toBeNull();
      expect(result?.win).toBe(win);
    });
  });

  describe('rejected URLs', () => {
    test.each([
      ['another page (window)', 'http://localhost:4321/window?theme=cupcake'],
      [
        'another page (settings) via file://',
        'file:///Users/me/app/dist-electron/renderer/settings/index.html?theme=cupcake',
      ],
      ['welcome as prefix of longer word (dev)', 'http://localhost:4321/welcome-page?x=1'],
      ['welcome as suffix of longer word (dev)', 'http://localhost:4321/foo-welcome?x=1'],
      [
        'welcome as prefix of longer word (file://)',
        'file:///Users/me/app/dist-electron/renderer/welcome-fake/index.html',
      ],
      ['chrome://settings (unrelated scheme)', 'chrome://settings/'],
      ['about:blank', 'about:blank'],
      ['empty path', 'http://localhost:4321'],
    ])('rejects %s', (_label, url) => {
      const win = fakeWelcomeWindow(42);
      browser.setWelcomeWindow(win);

      const result = welcomeWindowChecker(browser, makeEvent(url, 42), {});

      expect(result).toBeNull();
    });
  });

  describe('browser state', () => {
    test('rejects when no welcome window has been set', () => {
      const result = welcomeWindowChecker(
        browser,
        makeEvent('file:///path/to/welcome/index.html?theme=cupcake', 42),
        {},
      );
      expect(result).toBeNull();
    });

    test('rejects when webContents id does not match the welcome window', () => {
      browser.setWelcomeWindow(fakeWelcomeWindow(42));
      const result = welcomeWindowChecker(
        browser,
        makeEvent('file:///path/to/welcome/index.html?theme=cupcake', 99),
        {},
      );
      expect(result).toBeNull();
    });

    test('URL check happens first - bad URL with matching id still rejects', () => {
      browser.setWelcomeWindow(fakeWelcomeWindow(42));
      const result = welcomeWindowChecker(
        browser,
        makeEvent('http://localhost:4321/window', 42),
        {},
      );
      expect(result).toBeNull();
    });

    test('URL check happens first - good URL with no welcome window still rejects', () => {
      const result = welcomeWindowChecker(
        browser,
        makeEvent('file:///path/to/welcome/index.html?theme=cupcake', 42),
        {},
      );
      expect(result).toBeNull();
    });
  });
});
