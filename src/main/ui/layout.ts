import { TLayoutType, TLayoutChildren } from './types';
import { Rectangle } from 'electron';

export class UILayout {
  private readonly _children: TLayoutChildren[] = [];
  private _bounds: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
  private _visible = true;

  constructor(
    public readonly id: string,
    public readonly type: TLayoutType,
  ) {
    if (typeof type !== 'string') {
      this._bounds = type;
    }
  }

  get children(): TLayoutChildren[] {
    return this._children;
  }

  setBounds(bounds: Rectangle) {
    this._bounds = bounds;
  }

  get bounds(): Rectangle {
    return this._bounds;
  }

  addChild(child: TLayoutChildren) {
    this._children.push(child);
  }

  removeChild(child: TLayoutChildren) {
    const index = this._children.indexOf(child);
    if (index !== -1) {
      this._children.splice(index, 1);
    }
  }

  setVisible(visible: boolean) {
    this._visible = visible;

    for (const child of this._children) {
      child.setVisible(visible);
    }
  }

  get visible(): boolean {
    return this._visible;
  }
}
