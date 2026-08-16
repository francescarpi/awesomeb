import { ICommand } from './types';
import { INTERNAL_PROTOCOL } from '~/constants';

export interface ICommandParams {}

export const TRIGGER = 'manage-extensions';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.manageExtensions.name',
  description: 'commands.manageExtensions.description',
  async handler({ browser }) {
    browser.openURL(`${INTERNAL_PROTOCOL}://extensions`, {
      selectTab: true,
    });
  },
};
