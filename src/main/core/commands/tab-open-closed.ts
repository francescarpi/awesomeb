import { ICommand } from './types';
import { closedHistory } from '@/core';

export interface ICommandParams {
  url: string;
}

export const TRIGGER = 'open-closed';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Open Closed Tab',
  description: 'Open the most recently closed tab',
  modal: {
    page: 'open-closed',
  },
  visibility: ({}) => closedHistory.tabs.length > 0, // Only show if there are closed tabs
  async handler({ params, browser }) {
    await browser.openURL(params.url, { selectTab: true });
  },
};
