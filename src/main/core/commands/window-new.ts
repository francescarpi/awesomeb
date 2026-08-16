import type { ICommand } from './types';
import type { TEntityType } from '~/types';
import { createWindowByTarget, Window } from '@/core';

export interface ICommandParams {
  target: TEntityType;
}

export const TRIGGER = 'new-window';

export const Command: ICommand<ICommandParams, { window: Window | null }> = {
  trigger: TRIGGER,
  name: 'commands.newWindow.name',
  description: 'commands.newWindow.description',
  modal: {
    page: 'new-window',
  },
  async handler({ params, browser, window }) {
    const newWindow = createWindowByTarget(browser, window, params.target);
    return { window: newWindow };
  },
  onPerformed({ window }) {
    if (window) {
      window.focus();
    }
  },
};
