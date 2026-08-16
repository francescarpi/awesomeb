import { ICommand } from './types';
import { notification } from '@/core';

export interface ICommandParams {}

export const TRIGGER = 'save-session';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.saveSession.name',
  description: 'commands.saveSession.description',
  async handler({ browser }) {
    browser.saveSession();
    notification('Session Save', 'Session saved successfully');
  },
};
