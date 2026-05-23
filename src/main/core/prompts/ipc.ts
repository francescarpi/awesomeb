import { Browser, Window } from '@/core';
import { IpcMainEvent } from 'electron';
import type { IWinDesConTab } from '~/types';
import { PromptPrompt, AlertPrompt, ConfirmPrompt, PromptBase } from './models';
import { createHandler, tabChecker, windowChecker, promptChecker } from '@/utils';

export function setupPromptsIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ tab: IWinDesConTab; event: IpcMainEvent; message: string }>(
    'prompts:alert',
    'on',
    browser,
    [tabChecker],
    async ({ tab, event, message }) => {
      const obj = new AlertPrompt(tab, event, message);
      tab.window.prompts.enqueue(obj);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tab: IWinDesConTab; event: IpcMainEvent; message: string }>(
    'prompts:confirm',
    'on',
    browser,
    [tabChecker],
    async ({ tab, event, message }) => {
      const obj = new ConfirmPrompt(tab, event, message);
      tab.window.prompts.enqueue(obj);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tab: IWinDesConTab; event: IpcMainEvent; message: string; defaultValue: string }>(
    'prompts:prompt',
    'on',
    browser,
    [tabChecker],
    async ({ tab, event, message, defaultValue }) => {
      const obj = new PromptPrompt(tab, event, message, defaultValue);
      tab.window.prompts.enqueue(obj);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; prompt: PromptBase; response: unknown }>(
    'prompts:response',
    'on',
    browser,
    [windowChecker, promptChecker],
    async ({ win, prompt, response }) => {
      prompt.setReturnValue(response);
      win.prompts.next();
    },
  );
}
