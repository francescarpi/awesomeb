import { type IpcMainInvokeEvent, ipcMain } from 'electron';
import log from 'electron-log';
import { Browser, Window } from '@/core';
import { UIPageView } from '@/ui';
import { INTERNAL_PROTOCOL } from '~/constants';
import type { IWinDesConTab, TWindowId, TExtensionId, IExtension } from '~/types';

const scopeLog = log.scope('IPCEventManager');

//--------------------------------------------------------------------------------
export function createHandler<T extends object>(
  channel: string,
  method: 'handle' | 'on',
  browser: Browser,
  checkers: Function[], // eslint-disable-line
  callback: (args: T) => Promise<unknown>,
) {
  const ipcMethod = method === 'handle' ? ipcMain.handle.bind(ipcMain) : ipcMain.on.bind(ipcMain);

  ipcMethod(channel, async (event: IpcMainInvokeEvent, rawArgs: Record<string, unknown>) => {
    scopeLog.info(`[${channel}] received with props: `, rawArgs);

    const args = { ...rawArgs } as T;
    for (const checker of checkers) {
      const result = checker(browser, event, args);
      if (result === null) {
        scopeLog.warn(`[${channel}] validation failed in checker ${checker.name}`);
        return;
      }
      Object.assign(args, result);
    }

    return await callback(args);
  });
}

//--------------------------------------------------------------------------------
export function internalPageChecker(
  page: string,
  browser: Browser,
  event: IpcMainInvokeEvent,
  _args: Record<string, unknown>,
): { tabData: IWinDesConTab } | null {
  for (const tabData of browser.tabs) {
    if (tabData.tab.url && tabData.tab.url.startsWith(`${INTERNAL_PROTOCOL}://${page}/`)) {
      if (tabData.tab.webContentsId === event.sender.id) {
        return { tabData };
      }
    }
  }
  return null;
}

//--------------------------------------------------------------------------------
export function windowChecker(
  browser: Browser,
  _event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): { win: Window } | null {
  const { winId } = args as { winId?: TWindowId };
  if (!winId) {
    scopeLog.warn(`[WindowChecker] Missing window ID`);
    return null;
  }

  const win = browser.getWindow(winId);
  if (!win) {
    scopeLog.warn(`[WindowChecker] No window found with ID ${winId}`);
    return null;
  }

  return { win };
}

//--------------------------------------------------------------------------------
export function viewChecker(
  viewId: string,
  _browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): { win: Window } | null {
  const { win } = args as { win?: Window };
  if (!win) {
    scopeLog.warn(`[ViewChecker] Missing window object for view ${viewId}`);
    return null;
  }

  const view = win.getView<UIPageView>(viewId);
  if (view?.webContentsId !== event.sender.id) {
    scopeLog.warn(`[ViewChecker] WebContents ID mismatch for view ${viewId} in window ${win.id}`, {
      expected: view?.webContentsId,
      actual: event.sender.id,
    });
    return null;
  }

  return { win };
}

//--------------------------------------------------------------------------------
export function extensionChecker(
  browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): { win: Window; extension: IExtension } | null {
  const { win, extensionId } = args as { win?: Window; extensionId?: TExtensionId };
  if (!win) {
    scopeLog.warn(`[ExtensionChecker] Missing window object for extension action`);
    return null;
  }

  if (!extensionId) {
    scopeLog.warn(
      `[ExtensionChecker] Missing extension ID for extension action in window ${win.id}`,
    );
    return null;
  }

  if (!event.sender.getURL().startsWith(`chrome-extension://${extensionId}/`)) {
    scopeLog.warn(
      `[ExtensionChecker] WebContents URL does not match expected extension URL for extension ${extensionId} in window ${win.id}`,
      {
        expectedPrefix: `chrome-extension://${extensionId}/`,
        actual: event.sender.getURL(),
      },
    );
    return null;
  }

  const extension = browser.extensions.getExtension(extensionId);
  if (!extension) {
    scopeLog.warn(
      `[ExtensionChecker] No extension found with ID ${extensionId} for extension action in window ${win.id}`,
    );
    return null;
  }

  return { win, extension };
}
