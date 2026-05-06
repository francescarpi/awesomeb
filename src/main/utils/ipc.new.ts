import { type IpcMainInvokeEvent, ipcMain } from 'electron';
import log from 'electron-log';
import { Browser, Window } from '@/core';
import { UIPageView } from '@/ui';
import { INTERNAL_PROTOCOL } from '~/constants';
import type { IWinDesConTab, TWindowId, TExtensionId, IExtension } from '~/types';

const scopeLog = log.scope('IPCEventManager');

// TODO split checkers into little parts. One to check the window and send the window to the next one

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

    const results = (await Promise.all(
      checkers.map((checker) => checker(browser, event, rawArgs)),
    )) as unknown[];

    const valid = results.every((r) => r !== null);
    if (!valid) {
      scopeLog.warn(`[${channel}] validation failed`, { results });
      return;
    }

    const args = { ...rawArgs } as T;
    for (const result of results) {
      Object.assign(args, result);
    }

    return await callback(args);
  });
}

export async function internalPageChecker(
  page: string,
  browser: Browser,
  event: IpcMainInvokeEvent,
  _args: Record<string, unknown>,
): Promise<{ tabData: IWinDesConTab } | null> {
  for (const tabData of browser.tabs) {
    if (tabData.tab.url && tabData.tab.url.startsWith(`${INTERNAL_PROTOCOL}://${page}/`)) {
      if (tabData.tab.webContentsId === event.sender.id) {
        return { tabData };
      }
    }
  }
  return null;
}

export async function viewChecker(
  viewId: string,
  browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): Promise<{ win: Window } | null> {
  const { winId } = args as { winId?: TWindowId };
  if (!winId) {
    scopeLog.warn(`[ViewChecker] Missing window ID for view ${viewId}`);
    return null;
  }

  const win = browser.getWindow(winId);
  if (!win) {
    scopeLog.warn(`[ViewChecker] No window found with ID ${winId} for view ${viewId}`);
    return null;
  }

  const view = win.getView<UIPageView>(viewId);
  if (view?.webContentsId !== event.sender.id) {
    scopeLog.warn(`[ViewChecker] WebContents ID mismatch for view ${viewId} in window ${winId}`, {
      expected: view?.webContentsId,
      actual: event.sender.id,
    });
    return null;
  }

  return { win };
}

export async function extensionChecker(
  browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): Promise<{ win: Window; extension: IExtension } | null> {
  const { winId, extensionId } = args as { winId?: TWindowId; extensionId?: TExtensionId };

  if (!winId) {
    scopeLog.warn(`[ExtensionChecker] Missing window ID for extension action`);
    return null;
  }

  const win = browser.getWindow(winId);
  if (!win) {
    scopeLog.warn(`[ExtensionChecker] No window found with ID ${winId} for extension action`);
    return null;
  }

  if (!extensionId) {
    scopeLog.warn(
      `[ExtensionChecker] Missing extension ID for extension action in window ${winId}`,
    );
    return null;
  }

  if (!event.sender.getURL().startsWith(`chrome-extension://${extensionId}/`)) {
    scopeLog.warn(
      `[ExtensionChecker] WebContents URL does not match expected extension URL for extension ${extensionId} in window ${winId}`,
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
      `[ExtensionChecker] No extension found with ID ${extensionId} for extension action in window ${winId}`,
    );
    return null;
  }

  return { win, extension };
}
