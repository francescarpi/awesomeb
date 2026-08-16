import { ICommand } from './types';
import { INTERNAL_PROTOCOL } from '~/constants';

export interface ICommandParams {}

export const TRIGGER = 'manage-history';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.manageHistory.name',
  description: 'commands.manageHistory.description',
  visibility: ({ window }) => !!window,
  async handler({ browser }) {
    browser.openURL(`${INTERNAL_PROTOCOL}://history/`, { selectTab: true });
  },
};
