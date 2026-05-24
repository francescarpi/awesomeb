import { ICommand } from './types';
import { INTERNAL_PROTOCOL } from '~/constants';

export interface ICommandParams {}

export const TRIGGER = 'debug-page';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Debug Page',
  description: 'Open the debug page.',
  visibility: ({ window }) => !!window,
  async handler({ browser }) {
    browser.openURL(`${INTERNAL_PROTOCOL}://debug/`, { selectTab: true });
  },
};
