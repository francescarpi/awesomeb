import { ICommand } from './types';
import { notification, openURLHistory } from '@/core';

export interface ICommandParams {}

export const TRIGGER = 'clear-url-history';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Clear URL History',
  description: "Clear the browser's URL history",
  async handler({}) {
    openURLHistory.clear();
    notification('URL History Cleared', 'URL history cleaned successfully');
  },
};
