import { Browser, Window } from '@main/core';
import { TPage } from '@shared/types';

export interface ICommand<T> {
  trigger: string;
  name: string;
  description: string;
  page?: TPage;
  handler: (browser: Browser, params: T) => Promise<void>;
  visibility?: (params: { focusedWindow: Window | null }) => boolean;
}
