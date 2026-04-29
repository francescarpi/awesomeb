import { UIModal, UIContextualModal } from './models';
import { UIWindow } from '../window';
import { IContextualModalParams, TPage } from '~/types';
import { IProps } from './types';
import { DEFAULT_MODALS_PROPS } from './constants';

export class UIModalManager {
  private _modal: UIModal | null = null;

  constructor(private readonly _win: UIWindow) {}

  open(page: TPage, props?: IProps): UIModal {
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

    return this._modal;
  }

  close() {
    if (this._modal) {
      this._modal.bw.destroy();
      this._modal = null;
    }
  }

  resize(width: number, height: number) {
    if (this._modal) {
      this._modal.bw.setSize(width, height);
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

  openContextual(page: TPage, props: IContextualModalParams) {
    const view = new UIContextualModal(this._win, page, props);
    this._win.addView(view);
  }

  closeContextual() {
    const view = this._win.getView<UIContextualModal>('contextual-modal');
    if (!view) {
      return;
    }

    this._win.removeView('contextual-modal');
  }
}
