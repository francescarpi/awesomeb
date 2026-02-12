import { UIModal } from './models';
import { UIWindow } from '../window';
import { TPage } from '~/types';
import { IProps } from './types';
import { DEFAULT_MODALS_PROPS } from './constants';

export class UIModalManager {
  private _modal: UIModal | null = null;

  constructor(private readonly _win: UIWindow) {}

  open(page: TPage, props?: IProps) {
    if (this._modal) {
      this.close();
    }

    let modalProps = props || {};

    if (DEFAULT_MODALS_PROPS[page]) {
      modalProps = {
        ...DEFAULT_MODALS_PROPS[page],
        ...modalProps,
      };
    }

    this._modal = new UIModal(this._win, page, modalProps);
  }

  close() {
    if (this._modal) {
      this._modal.bw.hide();
      this._modal = null;
    }
  }

  get modal(): UIModal | null {
    return this._modal;
  }

  get id(): number | null {
    return this._modal ? this._modal.wcId : null;
  }

  get isOpen(): boolean {
    return this._modal !== null;
  }
}
