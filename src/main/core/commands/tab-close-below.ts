import { TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { getTab } from './helpers';

const scopeLog = log.scope('CloseTabsBelowCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'close-tabs-below';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Close Tabs Below',
  description: 'Closes all tabs below the current one.',
  visibility: ({ tab }) => !!tab,
  async handler({ browser, window, tab, params }) {
    const tabToClose = getTab(browser, tab, params?.tabId);
    if (!tabToClose) {
      scopeLog.warn('No tab available to close.');
      return;
    }

    const tabInfo = window.getTab(tabToClose.id)!;
    const tabsBelow = tabInfo.desktop.getTabsBelow(tabToClose.id);

    const promises = tabsBelow.map((tb) => browser.closeTab(tb.tab.id, { emit: false }));
    await Promise.all(promises);

    window.selectTab(tabToClose.id);

    browser.eventsChannel.emit('window:tab-did-close', window);
  },
};
