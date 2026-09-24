import { describe, expect, test, vi, type Mock } from 'vitest';
import type { AuthInfo, WebContents } from 'electron';
import { handleLoginEvent, type LoginCallback, type LoginEventArgs } from './app.events';
import type { Browser } from '@/core';

const authInfo: AuthInfo = {
  isProxy: false,
  scheme: 'basic',
  host: 'git.example.com',
  port: 443,
  realm: 'Git Access',
};

function makeWebContents(
  id: number,
  type: string = 'browserView',
  url: string = 'https://example.com',
): WebContents {
  return {
    id,
    getType: () => type as ReturnType<WebContents['getType']>,
    getURL: () => url,
  } as unknown as WebContents;
}

function makeArgs(overrides: Partial<LoginEventArgs> = {}): {
  args: LoginEventArgs;
  callback: Mock;
} {
  const callback = vi.fn();
  const args: LoginEventArgs = {
    webContents: makeWebContents(1),
    authInfo,
    callback: callback as unknown as LoginCallback,
    ...overrides,
  };
  return { args, callback };
}

describe('handleLoginEvent', () => {
  test('cancels the auth challenge when webContents is null (utility process case)', () => {
    const { args, callback } = makeArgs({ webContents: null });
    const browser = { getTabByWebContentsId: vi.fn() } as unknown as Browser;

    handleLoginEvent(browser, args);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith();
    expect(browser.getTabByWebContentsId).not.toHaveBeenCalled();
  });

  test('cancels the auth challenge for external webContents (extension service worker / background page)', () => {
    // MV3 service worker webContents: lives in the extension's session, not in
    // our _webContentsIndex. URL starts with chrome-extension://.
    const swWebContents = makeWebContents(
      42,
      'serviceWorker',
      'chrome-extension://gjkddcofhiifldbllobcamllmanombji/dist/js/background-script.js',
    );
    const { args, callback } = makeArgs({ webContents: swWebContents });
    const browser = {
      getTabByWebContentsId: vi.fn().mockReturnValue(null),
    } as unknown as Browser;

    handleLoginEvent(browser, args);

    expect(browser.getTabByWebContentsId).toHaveBeenCalledWith(42);
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith();
  });

  test('opens the login modal and wires the callback for our own tab', () => {
    const setBasicAuthCallback = vi.fn();
    const modalOpen = vi.fn();
    const tab = { id: 5, setBasicAuthCallback };
    const window = { id: 7, modal: { open: modalOpen } };
    const { args, callback } = makeArgs({ webContents: makeWebContents(99) });
    const browser = {
      getTabByWebContentsId: vi.fn().mockReturnValue({ tab, window }),
    } as unknown as Browser;

    handleLoginEvent(browser, args);

    expect(browser.getTabByWebContentsId).toHaveBeenCalledWith(99);
    expect(setBasicAuthCallback).toHaveBeenCalledWith(callback);
    expect(modalOpen).toHaveBeenCalledWith('login', {
      query: {
        host: 'git.example.com',
        realm: 'Git Access',
        winId: '7',
        tabId: '5',
      },
    });
    // Callback is NOT invoked eagerly — it's stored on the tab and invoked
    // by the renderer when the user submits the login form (or cancels).
    expect(callback).not.toHaveBeenCalled();
  });
});
