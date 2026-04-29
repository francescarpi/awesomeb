import { Browser } from '@/core';
import log from 'electron-log';
import { ipcMain } from 'electron';

const scopeLog = log.scope('PromptsIPC');

export function setupPromptsIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('prompts:alert', async (event, { message }) => {
    scopeLog.info(`Alert: ${message}`);
    // TODO do we have to check the sender here?
    event.returnValue = undefined;
    return true;
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('prompts:confirm', async (event, { message }) => {
    scopeLog.info(`Confirm: ${message}`);
    // TODO do we have to check the sender here?
    event.returnValue = false;
    return true;
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('prompts:prompt', async (event, { message }) => {
    scopeLog.info(`Prompt: ${message}`);
    // TODO do we have to check the sender here?
    event.returnValue = null;
    return true;
  });
}
