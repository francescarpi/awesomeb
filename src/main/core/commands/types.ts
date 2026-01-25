import { Browser, Window } from '@/core';
import { IModalProps } from '@/ui';
import { TPage } from '~/types';

export interface ICommand<T> {
  trigger: string;
  name: string;
  description: string;
  modal?: ICommandModal;
  visibility?: (params: { focusedWindow: Window | null }) => boolean;
  handler: (browser: Browser, window: Window, params: T) => Promise<void>;
}

interface ICommandModal {
  page: TPage;
  props?: IModalProps;
}
