import { TTabId } from '~/types';
import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {
  targetId: string;
  tabId: TTabId;
}

export const TRIGGER = 'move-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:moveTab.name'),
  description: () => t('commands:moveTab.description'),
  modal: {
    page: 'move-tab',
  },
  visibility: ({ window }) => !!window,
  async handler({ params, browser }) {
    await browser.moveTab(params.tabId, params.targetId, { selectTab: true });
  },
};
