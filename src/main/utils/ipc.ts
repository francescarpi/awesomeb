import { IpcMainInvokeEvent } from 'electron';
import { Browser, Window } from '@/core';
import { TWindowId } from '~/types';
import log from 'electron-log';
import { UIModalManager, UIPageView } from '@/ui';

const scopeLog = log.scope('UtilsIPC');

export async function checkModalSender(
  event: IpcMainInvokeEvent,
  browser: Browser,
  winId: TWindowId,
  callback: (window: Window, modalManager: UIModalManager) => void,
): Promise<void> {
  const win = browser.getWindowById(winId);
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

export async function checkWindowViewSender(
  event: IpcMainInvokeEvent,
  browser: Browser,
  winId: TWindowId,
  page: string,
  callback: (window: Window, view: UIPageView) => void,
) {
  const win = browser.getWindowById(winId);
  if (!win) {
    scopeLog.warn(`Window with id ${winId} not found`);
    return;
  }

  const view = win.getNode<UIPageView>(page);
  if (!view || view.wcv.webContents.id !== event.sender.id) {
    scopeLog.warn(
      `Sender webContents id ${event.sender.id} does not match window id ${winId} and page ${page}`,
    );
    return;
  }

  callback(win, view);
}

export async function checkModalAndPagesSender<T>(
  event: IpcMainInvokeEvent,
  browser: Browser,
  winId: TWindowId,
  pages: string[],
  callback: (window: Window, modalManager: UIModalManager | null) => Promise<T>,
) {
  const win = browser.getWindowById(winId);
  if (!win || !win.modal) {
    scopeLog.error(`No window found with ID ${winId}`);
    return;
  }

  const allowedSenders: number[] = [];

  if (win.modal.id) {
    allowedSenders.push(win.modal.id);
  }

  for (const page of pages) {
    const view = win.getNode<UIPageView>(page);
    if (view) {
      allowedSenders.push(view.wcv.webContents.id);
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
  const win = browser.getWindowById(winId);
  if (!win) {
    scopeLog.error(`No window found with ID ${winId}`);
    return;
  }

  if (win.wcId !== event.sender.id) {
    scopeLog.error(
      `WebContents ID mismatch: window WC ID ${win.wcId} does not match sender WC ID ${event.sender.id}`,
    );
    return;
  }

  return callback(win);
}
