import { IpcMainInvokeEvent } from 'electron';
import { Browser, Window, Tab, FindInPage, Desktop, TabContainer, FailLoad } from '@/core';
import { TTabId, TWindowId } from '~/types';
import log from 'electron-log';
import { UIModalManager, UIPageView } from '@/ui';
import { INTERNAL_PROTOCOL } from '~/constants';
import { CertificateError } from '@/core/tab/certificate-error';

const scopeLog = log.scope('UtilsIPC');

export async function checkModalSender(
  event: IpcMainInvokeEvent,
  browser: Browser,
  winId: TWindowId,
  callback: (window: Window, modalManager: UIModalManager) => void,
): Promise<void> {
  const win = browser.getWindow(winId);
  if (!win || !win.modal) {
    scopeLog.error(`No window found with ID ${winId}`);
    return;
  }

  if (win.modal.id !== event.sender.id) {
    scopeLog.error(
      `WebContents ID mismatch: modal WC ID ${win.modal.id} does not match sender WC ID ${event.sender.id}`,
    );
    return;
  }

  return callback(win, win.modal);
}

export async function checkModalAndPagesSender<T>(
  event: IpcMainInvokeEvent,
  browser: Browser,
  winId: TWindowId,
  pages: string[],
  callback: (window: Window, modalManager: UIModalManager | null) => Promise<T>,
) {
  const win = browser.getWindow(winId);
  if (!win || !win.modal) {
    scopeLog.error(`No window found with ID ${winId}`);
    return;
  }

  const allowedSenders: number[] = [];

  if (win.modal.id) {
    allowedSenders.push(win.modal.id);
  }

  for (const page of pages) {
    const view = win.getView<UIPageView>(page);
    if (view) {
      allowedSenders.push(view.webContentsId);
    }
  }

  if (!allowedSenders.includes(event.sender.id)) {
    scopeLog.error(
      `WebContents ID mismatch: modal and pages WC IDs ${allowedSenders.join(
        ', ',
      )} do not match sender WC ID ${event.sender.id} and url ${event.sender.getURL()}`,
    );
    return;
  }

  return await callback(win, win.modal);
}

export async function checkWindowSender(
  event: IpcMainInvokeEvent,
  browser: Browser,
  winId: TWindowId,
  callback: (window: Window) => void,
): Promise<void> {
  const win = browser.getWindow(winId);
  if (!win) {
    scopeLog.error(`No window found with ID ${winId}`);
    return;
  }

  if (win.webContentsId !== event.sender.id) {
    scopeLog.error(
      `WebContents ID mismatch: window WC ID ${win.webContentsId} does not match sender WC ID ${event.sender.id}`,
    );
    return;
  }

  return callback(win);
}

export async function checkFindInPageSender(
  event: IpcMainInvokeEvent,
  browser: Browser,
  tabId: TTabId,
  callback: (tab: Tab, findInPage: FindInPage) => void,
): Promise<void> {
  const result = browser.getTab(tabId);
  if (!result) {
    scopeLog.error(`No tab found with ID ${tabId}`);
    return;
  }

  const { tab } = result;
  if (!tab.findInPage) {
    scopeLog.error(`Tab with ID ${tabId} does not have a findInPage view`);
    return;
  }

  if (tab.findInPage.webContentsId !== event.sender.id) {
    scopeLog.error(
      `WebContents ID mismatch: findInPage WC ID ${tab.findInPage.webContentsId} does not match sender WC ID ${event.sender.id}`,
    );
    return;
  }

  return callback(tab, tab.findInPage);
}

export async function checkInternalPage(
  event: IpcMainInvokeEvent,
  browser: Browser,
  page: string,
  callback: (window: Window, desktop: Desktop, tabContainer: TabContainer, tab: Tab) => void,
): Promise<void> {
  for (const tabResult of browser.tabs) {
    if (tabResult.tab.url && tabResult.tab.url === `${INTERNAL_PROTOCOL}://${page}/`) {
      if (tabResult.tab.webContentsId === event.sender.id) {
        return callback(tabResult.window, tabResult.desktop, tabResult.tabContainer, tabResult.tab);
      }
    }
  }

  scopeLog.error(
    `No internal page found with name ${page} matching sender WC ID ${event.sender.id}`,
  );
}

export async function checkFailLoadSender(
  event: IpcMainInvokeEvent,
  browser: Browser,
  tabId: TTabId,
  callback: (tab: Tab, failLoad: FailLoad) => void,
): Promise<void> {
  const result = browser.getTab(tabId);
  if (!result) {
    scopeLog.error(`No tab found with ID ${tabId}`);
    return;
  }

  const { tab } = result;
  if (!tab.failLoad) {
    scopeLog.error(`Tab with ID ${tabId} does not have a fail load view`);
    return;
  }

  if (tab.failLoad.webContentsId !== event.sender.id) {
    scopeLog.error(
      `WebContents ID mismatch: fail load WC ID ${tab.failLoad.webContentsId} does not match sender WC ID ${event.sender.id}`,
    );
    return;
  }

  return callback(tab, tab.failLoad);
}

export async function checkCertificateErrorSender(
  event: IpcMainInvokeEvent,
  browser: Browser,
  tabId: TTabId,
  callback: (tab: Tab, certificateError: CertificateError) => void,
): Promise<void> {
  const result = browser.getTab(tabId);
  if (!result) {
    scopeLog.error(`No tab found with ID ${tabId}`);
    return;
  }

  const { tab } = result;
  if (!tab.certificateError) {
    scopeLog.error(`Tab with ID ${tabId} does not have a certificate error view`);
    return;
  }

  if (tab.certificateError.webContentsId !== event.sender.id) {
    scopeLog.error(
      `WebContents ID mismatch: fail load WC ID ${tab.certificateError.webContentsId} does not match sender WC ID ${event.sender.id}`,
    );
    return;
  }

  return callback(tab, tab.certificateError);
}
