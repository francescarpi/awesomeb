import { UIModal } from './models';
import { UIWindow } from '../window';
import { TPage } from '~/types';
import { IProps } from './types';

export class UIModalManager {
  private _modal: UIModal | null = null;
  private _defaultModalProps = {
    'edit-url': {
      width: 700,
      height: 200,
    },
    'perform-command': {
      width: 500,
      height: 500,
    },
    'new-tab': {
      height: 600,
    },
    'select-desktop': {
      height: 450,
    },
    'select-tab': {
      height: 500,
    },
  };

  constructor(private readonly _win: UIWindow) {}

  open(page: TPage, props?: IProps) {
    if (this._modal) {
      this.close();
    }

    let modalProps = props || {};

    if (this._defaultModalProps[page]) {
      modalProps = {
        ...this._defaultModalProps[page],
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
