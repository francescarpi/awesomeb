import { ICommand } from './types';
import { Session, notification } from '@/core';

export interface ICommandParams {}

export const TRIGGER = 'save-session';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Save Session',
  description: 'Saves the current session to disk.',
  async handler({ browser }) {
    const session = new Session(browser);
    session.save();
    notification('Session Save', 'Session saved successfully');
  },
};
