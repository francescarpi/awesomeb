import { ICommand } from './types';
import { openURLHistory } from '@/core';

export interface ICommandParams {}

export const TRIGGER = 'clear-url-history';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Clear URL History',
  description: "Clear the browser's URL history",
  async handler({ window }) {
    openURLHistory.clear();
    window.notifications.show('URL history cleaned successfully');
  },
};
