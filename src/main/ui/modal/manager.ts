import { UIModal } from './models';
import { UIWindow } from '../window';
import { TPage } from '~/types';
import { IProps } from './types';

export class UIModalManager {
  private _modal: UIModal | null = null;

  constructor(private readonly _win: UIWindow) {}

  open(page: TPage, props?: IProps) {
    if (this._modal) {
      this.close();
    }

    this._modal = new UIModal(this._win, page, props);
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
