import { TLayoutType, TLayoutChildren, ILayoutProps } from './types';
import { Rectangle } from 'electron';

export class UINewLayout {
  private readonly _children: TLayoutChildren[] = [];
  private _bounds: Rectangle = { x: 0, y: 0, width: 100, height: 100 };

  constructor(
    public readonly id: string,
    public readonly type: TLayoutType,
    props?: ILayoutProps,
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
}
