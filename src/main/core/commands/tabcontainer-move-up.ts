import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'move-tab-container-up';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:moveTabContainerUp.name'),
  description: () => t('commands:moveTabContainerUp.description'),
  visibility: ({ tabContainer }) => !!tabContainer,
  async handler({ desktop, tabContainer }) {
    if (tabContainer) {
      desktop.moveTabContainer(tabContainer.id, 'up');
    }
  },
};
