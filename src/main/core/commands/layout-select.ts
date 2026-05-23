import { ICommand } from './types';
import { Layouts } from '@/core';
import log from 'electron-log';

const scopeLog = log.scope('SelectLayoutCommand');

export interface ICommandParams {
  layout: keyof typeof Layouts;
}

export const TRIGGER = 'select-layout';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Select layout',
  description: 'Select a layout for the current tab container',
  visibility: ({ tabContainer }) => (tabContainer && tabContainer.isSplit ? true : false),
  modal: {
    page: 'select-layout',
  },
  async handler({ params, tabContainer }) {
    if (!tabContainer) {
      scopeLog.warn(`No tab container found for ${TRIGGER} command`);
      return;
    }

    const layout = Layouts[params.layout];
    if (!layout) {
      scopeLog.warn(`Invalid layout key "${params.layout}" provided to ${TRIGGER} command`);
      return;
    }

    tabContainer.setLayout(layout);
  },
};
