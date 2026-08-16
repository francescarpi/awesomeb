import { ICommand } from './types';
import { INTERNAL_PROTOCOL } from '~/constants';

export interface ICommandParams {}

export const TRIGGER = 'debug-page';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.debugPage.name',
  description: 'commands.debugPage.description',
  visibility: ({ window }) => !!window,
  async handler({ browser }) {
    browser.openURL(`${INTERNAL_PROTOCOL}://debug/`, { selectTab: true });
  },
};
