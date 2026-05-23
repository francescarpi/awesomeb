import { Browser, Desktop, Tab, TabContainer, Window } from '@/core';
import { IModalProps } from '@/ui';
import { TPage } from '~/types';

export interface ICommand<T> {
  trigger: string;
  name: string;
  description: string;
  modal?: ICommandModal;
  visibility?: (params: {
    window: Window | null;
    desktop: Desktop | null;
    tabContainer: TabContainer | null;
    tab: Tab | null;
  }) => boolean;
  handler: (params: {
    browser: Browser;
    window: Window;
    desktop: Desktop;
    tabContainer: TabContainer | null;
    tab: Tab | null;
    params: T;
  }) => Promise<void>;
}

interface ICommandModal {
  page: TPage;
  props?: IModalProps;
}
