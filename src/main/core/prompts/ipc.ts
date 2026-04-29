import { Browser, Window } from '@/core';
import log from 'electron-log';
import { ipcMain, IpcMainEvent } from 'electron';
import type { IWinDesConTab, TWindowId } from '~/types';
import { PromptPrompt, AlertPrompt, ConfirmPrompt, PromptBase } from './models';

const scopeLog = log.scope('PromptsIPC');

export function setupPromptsIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('prompts:alert', async (event, { message }) => {
    scopeLog.info(`Alert: ${message}`);
    return await checkPromptsSender(event, browser, (tab) => {
      const obj = new AlertPrompt(tab, event, message);
      tab.window.prompts.enqueue(obj);
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('prompts:confirm', async (event, { message }) => {
    scopeLog.info(`Confirm: ${message}`);
    return await checkPromptsSender(event, browser, (tab) => {
      const obj = new ConfirmPrompt(tab, event, message);
      tab.window.prompts.enqueue(obj);
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('prompts:prompt', async (event, { message, defaultValue }) => {
    scopeLog.info(`Prompt: ${message}`);
    return await checkPromptsSender(event, browser, (tab) => {
      const obj = new PromptPrompt(tab, event, message, defaultValue);
      tab.window.prompts.enqueue(obj);
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('prompts:response', async (event, winId, response) => {
    scopeLog.info(`Prompt on window ${winId} send the response: ${response}`);
    return await checkResponseSender(event, browser, winId, (win, prompt) => {
      prompt.setReturnValue(response);
      win.prompts.next();
    });
  });
}

//--------------------------------------------------------------------------------------
async function checkPromptsSender(
  event: IpcMainEvent,
  browser: Browser,
  callback: (data: IWinDesConTab) => void,
) {
  const tab = browser.getTabByWebContentsId(event.sender.id);
  if (!tab) {
    scopeLog.warn('Received prompt IPC from unknown sender');
    return false;
  }

  callback(tab);
  return true;
}

//--------------------------------------------------------------------------------------
async function checkResponseSender(
  event: IpcMainEvent,
  browser: Browser,
  winId: TWindowId,
  callback: (win: Window, prompt: PromptBase) => void,
) {
  const win = browser.getWindow(winId);
  if (!win || !win.prompts.current) {
    scopeLog.warn('Received prompt response IPC from unknown sender');
    return;
  }

  if (event.sender.id !== win.prompts.current.modalId) {
    scopeLog.warn(
      'Received prompt response IPC from sender that does not match the current prompt',
    );
    return;
  }

  return callback(win, win.prompts.current);
}
