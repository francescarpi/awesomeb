import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'move-tab-container-down';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:moveTabContainerDown.name'),
  description: () => t('commands:moveTabContainerDown.description'),
  visibility: ({ tabContainer }) => !!tabContainer,
  async handler({ desktop, tabContainer }) {
    if (tabContainer) {
      desktop.moveTabContainer(tabContainer.id, 'down');
    }
  },
};
