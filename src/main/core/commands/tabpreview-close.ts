import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('CloseTabPreviewCommand');

export interface ICommandParams {}

export const TRIGGER = 'close-tab-preview';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Close Tab Preview',
  description: 'Close the preview of the current tab',
  visibility: ({ tab }) => !!tab?.tabPreview,
  async handler({ browser, tab, window }) {
    if (!tab) {
      scopeLog.warn('No tab found');
      return;
    }

    const tabPreview = tab.tabPreview;
    if (!tabPreview) {
      scopeLog.warn(`No preview tab found for Tab ID ${tab.id}`);
      return;
    }

    window.removeView(tabPreview.tab.view.id);
    window.removeView(tabPreview.id);

    tab.setTabPreview(null);

    tabPreview.close();

    window.refreshTabsVisibility();
    browser.refreshMainMenu();
  },
};
