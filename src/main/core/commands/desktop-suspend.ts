import { TDesktopId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('SuspendDesktopCommand');

export interface ICommandParams {
  desktopId: TDesktopId;
}

export const TRIGGER = 'suspend-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:suspendDesktop.name'),
  description: () => t('commands:suspendDesktop.description'),
  modal: {
    page: TRIGGER,
  },
  visibility: ({ window }) => !!window,
  async handler({ params, window, browser }) {
    const desktop = window.getDesktop(params.desktopId);
    if (!desktop) {
      scopeLog.error(`Desktop with id ${params.desktopId} not found`);
      return;
    }

    const promises = desktop.tabs.map((tabResult) =>
      window.suspendTab(tabResult.tab.id, { emit: false }),
    );

    await Promise.all(promises);

    browser.eventsChannel.emit('window:tab-did-suspend', window);
  },
};
