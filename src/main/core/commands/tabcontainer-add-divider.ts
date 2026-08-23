import { TTabContainerId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('AddDividerCommand');

export interface ICommandParams {
  tabContainerId: TTabContainerId;
}

export const TRIGGER = 'add-divider';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:addDivider.name'),
  description: () => t('commands:addDivider.description'),
  modal: {
    page: TRIGGER,
  },
  visibility: ({ desktop }) => (desktop ? desktop.tabContainers.length > 0 : false),
  async handler({ params, browser }) {
    const tabContainerResult = browser.getTabContainer(params.tabContainerId);
    if (!tabContainerResult) {
      scopeLog.warn(`Tab container with id ${params.tabContainerId} not found.`);
      return;
    }
    tabContainerResult.tabContainer.setDivider(true);
  },
};
