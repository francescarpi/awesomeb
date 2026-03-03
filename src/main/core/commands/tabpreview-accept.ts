import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('AcceptTabPreviewCommand');

export interface ICommandParams {}

export const TRIGGER = 'accept-tab-preview';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Accept Tab Preview',
  description: 'Accept the preview of the current tab',
  visibility: ({ tab }) => !!tab?.tabPreview,
  async handler({ browser, tab, window, desktop }) {
    if (!tab) {
      scopeLog.warn('No tab found ');
      return;
    }

    const tabPreview = tab.tabPreview;
    if (!tabPreview) {
      scopeLog.warn(`No preview tab found for Tab ID ${tab.id}`);
      return;
    }

    // TODO move this logic to the browser?????
    const tabContainer = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tabContainer.addTab(tabPreview.tab);
    tabContainer.selectTab(tabPreview.tab.id);

    desktop.addTabContainer(tabContainer);
    desktop.selectTabContainer(tabContainer.id);

    tabPreview.tab.clearParent();

    // TODO tab.setTabPreview(null);

    // treure el parent del tab
    // del parent, deslligar el tabpreview i eliminar l'objecte
    // afegir el tab a un tab container
    // afegir el tab container al desktop
    // seleccionar el tab/tabcontainer
    // elimninar la vista del tab preview del window

    // window.removeView(tabPreview.tab.view.id);
    // window.removeView(tabPreview.id);
    //
    // tab.setTabPreview(null);
    //
    // tabPreview.close();
    //
    // window.refreshTabsVisibility();
    // browser.refreshMainMenu();
  },
};
