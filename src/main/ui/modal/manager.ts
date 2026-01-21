import { UIModal } from './models';
import { UIWindow } from '../window';
import { TPage } from '@shared/types';

export class UIModalManager {
  private _modal: UIModal | null = null;

  constructor(private readonly _win: UIWindow) {}

  open(page: TPage) {
    if (this._modal) {
      this.close();
    }

    this._modal = new UIModal(this._win, page);
  }

  close() {
    if (this._modal) {
      this._modal.hide();
      this._modal.close();
      this._modal = null;
    }
  }

  get modal(): UIModal | null {
    return this._modal;
  }

  get id(): number | null {
    return this._modal ? this._modal.webContents.id : null;
  }
}
