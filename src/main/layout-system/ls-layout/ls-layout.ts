import { LSView } from '../ls-view';
import { Rectangle } from 'electron';

export class LSLayout {
  constructor(
    private readonly _orientation: 'vertical' | 'horizontal',
    private readonly _views: LSView[] = [],
  ) {}

  get views(): LSView[] {
    return this._views;
  }

  refreshBounds(containerBounds: Rectangle) {
    if (this._orientation === 'vertical') {
      const viewWidth = Math.floor(containerBounds.width / this._views.length);
      this._views.forEach((view, index) => {
        view.setBounds({
          x: index * viewWidth,
          y: 0,
          width: viewWidth,
          height: containerBounds.height,
        });
      });
    } else {
      const viewHeight = Math.floor(containerBounds.height / this._views.length);
      this._views.forEach((view, index) => {
        view.setBounds({
          x: 0,
          y: index * viewHeight,
          width: containerBounds.width,
          height: viewHeight,
        });
      });
    }
  }
}
