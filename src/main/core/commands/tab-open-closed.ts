import { ICommand } from './types';
// import log from 'electron-log';
//
// const scopeLog = log.scope('OpenClosedCommand');

export interface ICommandParams {
  id: string;
}

export const TRIGGER = 'open-closed';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Open Closed Tab',
  description: 'Open the most recently closed tab',
  modal: {
    page: 'open-closed',
  },
  // visibility: ({}) => closedTabs.tabs.length > 0, // Only show if there are closed tabs
  async handler({}) {
    // const tab = closedTabs.getTab(params.id);
    // if (!tab) {
    //   scopeLog.warn(`No closed tab found with id: ${params.id}`);
    //   return;
    // }
    //
    // console.log(tab);
    // await browser.openURL(params.url, { selectTab: true });
  },
};
