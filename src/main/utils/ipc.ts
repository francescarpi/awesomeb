import { type IpcMainInvokeEvent, ipcMain } from 'electron';
import log from 'electron-log';
import { Browser, FindInPage, Window } from '@/core';
import { UIPageView } from '@/ui';
import { INTERNAL_PROTOCOL } from '~/constants';
import type { IWinDesConTab, TWindowId, TExtensionId, IExtension, TTabId } from '~/types';
import { PromptBase } from '@/core/prompts/models';
import { CertificateError } from '@/core/tab/certificate-error';

const scopeLog = log.scope('IPCEventManager');

//--------------------------------------------------------------------------------
type CheckerFn = Function; // eslint-disable-line
type CheckerGroup = CheckerFn[];
type Checker = CheckerFn | CheckerGroup;

export function createHandler<T extends object>(
  channel: string,
  method: 'handle' | 'on',
  browser: Browser,
  checkers: Checker[],
  callback: (args: T) => Promise<unknown>,
) {
  const ipcMethod = method === 'handle' ? ipcMain.handle.bind(ipcMain) : ipcMain.on.bind(ipcMain);

  ipcMethod(channel, async (event: IpcMainInvokeEvent, rawArgs: Record<string, unknown>) => {
    scopeLog.info(`[${channel}] received with props: `, rawArgs);

    const args = { ...rawArgs, event } as T;

    const resolvedCheckers: Checker[] = [];
    for (const checker of checkers) {
      if (Array.isArray(checker)) {
        resolvedCheckers.push(checker);
      } else if (checker.name === 'bound conditionalChecker') {
        const conditionalResult = checker(args);
        if (conditionalResult === null) {
          scopeLog.warn(`[${channel}] conditionalChecker failed`);
          return;
        }
        resolvedCheckers.push(() => conditionalResult);
      } else {
        resolvedCheckers.push(checker);
      }
    }

    for (const checker of resolvedCheckers) {
      if (Array.isArray(checker)) {
        let anyPassed = false;
        for (const altChecker of checker) {
          const result = altChecker(browser, event, args);
          if (result !== null) {
            Object.assign(args, result);
            anyPassed = true;
            break;
          }
        }
        if (!anyPassed) {
          scopeLog.warn(`[${channel}] validation failed: no checker passed OR group`);
          return;
        }
      } else {
        const result = checker(browser, event, args);
        if (result === null) {
          scopeLog.warn(`[${channel}] validation failed in checker ${checker.name}`);
          return;
        }
        Object.assign(args, result);
      }
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
  event: IpcMainInvokeEvent,
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

  if (win.bw.webContents.id !== event.sender.id) {
    scopeLog.warn(
      `[WindowChecker] WebContents ID ${event.sender.id} does not match window WebContents ID ${win.bw.webContents.id} for window ${winId}`,
    );
    return null;
  }

  return { win };
}

//--------------------------------------------------------------------------------
export function viewChecker(
  viewsIds: string[],
  _browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): { win: Window } | null {
  const { win } = args as { win?: Window };
  if (!win) {
    scopeLog.warn(`[ViewChecker] Missing window object for views ${viewsIds.join(', ')}`);
    return null;
  }

  const allowedIds: number[] = [];
  for (const viewId of viewsIds) {
    const view = win.getView<UIPageView>(viewId);
    if (!view) {
      scopeLog.warn(`[ViewChecker] No view found with ID ${viewId} in window ${win.id}`);
      return null;
    }
    allowedIds.push(view.webContentsId);
  }

  if (!allowedIds.includes(event.sender.id)) {
    scopeLog.warn(
      `[ViewChecker] WebContents ID ${event.sender.id} does not match any allowed IDs for views ${viewsIds.join(
        ', ',
      )} in window ${win.id}`,
      {
        allowedIds,
        actual: event.sender.id,
      },
    );
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

//--------------------------------------------------------------------------------
export function modalChecker(
  _browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): { win: Window } | null {
  const { win } = args as { win?: Window };
  if (!win) {
    scopeLog.warn(`[ModalChecker] Missing window object for modal action`);
    return null;
  }

  if (!win.modal) {
    scopeLog.warn(`[ModalChecker] Window ${win.id} is not a modal`);
    return null;
  }

  if (event.sender.id !== win.modal.id) {
    scopeLog.warn(
      `[ModalChecker] WebContents ID ${event.sender.id} does not match modal WebContents ID ${win.modal.id} for window ${win.id}`,
    );
    return null;
  }

  return { win };
}

//--------------------------------------------------------------------------------
export function tabChecker(
  browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): { tab: IWinDesConTab } | null {
  let tab: IWinDesConTab | null;

  if (args.tabId) {
    tab = browser.getTab(args.tabId as TTabId);
  } else {
    tab = browser.getTabByWebContentsId(event.sender.id);
  }

  if (!tab) {
    scopeLog.warn(`[TabChecker] No tab found for WebContents ID ${event.sender.id}`);
    return null;
  }

  return { tab };
}

//--------------------------------------------------------------------------------
export function promptChecker(
  _browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): { prompt: PromptBase } | null {
  const { win } = args as { win?: Window };
  if (!win) {
    scopeLog.warn(`[PromptChecker] Missing window object for prompt response`);
    return null;
  }

  if (!win.prompts.current) {
    scopeLog.warn(`[PromptChecker] No active prompt found in window ${win.id} for prompt response`);
    return null;
  }

  if (event.sender.id !== win.prompts.current.modalId) {
    scopeLog.warn(
      `[PromptChecker] WebContents ID ${event.sender.id} does not match current prompt modal ID ${win.prompts.current.modalId} in window ${win.id}`,
    );
    return null;
  }

  return { prompt: win.prompts.current };
}

//--------------------------------------------------------------------------------
export function findInPageChecker(
  _browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): { findInPage: FindInPage } | null {
  const { tab } = args as { tab?: IWinDesConTab };
  if (!tab) {
    scopeLog.warn(`[FindInPageChecker] Missing tab object for find-in-page action`);
    return null;
  }

  if (!tab.tab.findInPage) {
    scopeLog.warn(
      `[FindInPageChecker] Tab ${tab.tab.id} does not have a find-in-page view for find-in-page action`,
    );
    return null;
  }

  if (tab.tab.findInPage.webContentsId !== event.sender.id) {
    scopeLog.warn(
      `[FindInPageChecker] WebContents ID ${event.sender.id} does not match find-in-page WebContents ID ${tab.tab.findInPage.webContentsId} for tab ${tab.tab.id}`,
    );
    return null;
  }

  return { findInPage: tab.tab.findInPage };
}

//--------------------------------------------------------------------------------
export function certificateErrorChecker(
  _browser: Browser,
  event: IpcMainInvokeEvent,
  args: Record<string, unknown>,
): { certificateError: CertificateError } | null {
  const { tab } = args as { tab?: IWinDesConTab };
  if (!tab) {
    scopeLog.warn(`[CertificateErrorChecker] Missing tab object for certificate error response`);
    return null;
  }

  if (!tab.tab.certificateError) {
    scopeLog.warn(
      `[CertificateErrorChecker] Tab ${tab.tab.id} does not have a pending certificate error for certificate error response`,
    );
    return null;
  }

  if (tab.tab.certificateError.webContentsId !== event.sender.id) {
    scopeLog.warn(
      `[CertificateErrorChecker] WebContents ID ${event.sender.id} does not match certificate error WebContents ID ${tab.tab.certificateError.webContentsId} for tab ${tab.tab.id}`,
    );
    return null;
  }

  return { certificateError: tab.tab.certificateError };
}

//--------------------------------------------------------------------------------
export function conditionalChecker(
  criteriaFn: (args: Record<string, unknown>) => boolean,
  checker1: CheckerFn[],
  checker2: CheckerFn[],
  args: Record<string, unknown>,
): CheckerFn[] {
  return criteriaFn(args) ? checker1 : checker2;
}
