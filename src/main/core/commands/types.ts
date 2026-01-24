import { Browser, Window } from '@/core';
import { TPage } from '~/types';

export interface ICommand<T> {
  trigger: string;
  name: string;
  description: string;
  page?: TPage;
  visibility?: (params: { focusedWindow: Window | null }) => boolean;
  handler: (browser: Browser, window: Window, params: T) => Promise<void>;
}
