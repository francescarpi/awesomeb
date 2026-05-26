import type { ICommand } from './types';
import type { TEntityType } from '~/types';
import { parseTarget, Window } from '@/core';
import log from 'electron-log';

const scopeLog = log.scope('NewWindowCommand');

export interface ICommandParams {
  target: TEntityType;
}

export const TRIGGER = 'new-window';

export const Command: ICommand<ICommandParams, { window: Window | null }> = {
  trigger: TRIGGER,
  name: 'New Window',
  description: 'Open a new window',
  modal: {
    page: 'new-window',
  },
  async handler({ params, browser }) {
    const result = parseTarget(browser, { targetId: params.target });
    if (!result) {
      scopeLog.error('Failed to parse target', { params });
      return { window: null };
    }
    return { window: result.window };
  },
  onPerformed({ window }) {
    if (window) {
      window.focus();
    }
  },
};
