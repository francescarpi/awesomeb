import { TTabContainerId, TTabId } from '~/types';
import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {
  tabId: TTabId;
  position:
    | { kind: 'before-tab'; targetTabId: TTabId }
    | { kind: 'after-tab'; targetTabId: TTabId }
    | { kind: 'as-child'; targetTabId: TTabId }
    | { kind: 'out-of-container'; targetTabContainerId: TTabContainerId }
    | { kind: 'desktop' };
}

export const TRIGGER = 'move-tab-to-position';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:moveTabToPosition.name'),
  description: () => t('commands:moveTabToPosition.description'),
  visible: () => false,
  async handler({ browser, params }) {
    browser.moveTabToPosition(params.tabId, params.position);
  },
};
