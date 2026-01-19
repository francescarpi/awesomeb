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
      const fixedWidth = this._views.map((v) => v.props.width ?? 0).reduce((a, b) => a + b, 0);

      const flexibleViews = this._views.filter((v) => v.props.width === undefined);
      const remainingWidth = containerBounds.width - fixedWidth;
      const flexibleWidth = flexibleViews.length > 0 ? remainingWidth / flexibleViews.length : 0;

      let currentX = 0;
      for (const view of this._views) {
        let width = view.props.width;
        if (width === undefined) {
          width = flexibleWidth;
        }

        view.setBounds({
          x: Math.round(currentX),
          y: 0,
          width: Math.round(width),
          height: containerBounds.height,
        });

        currentX += width;
      }

      // Adjust the last view to fill the container and avoid rounding errors.
      if (this._views.length > 0) {
        const lastView = this._views[this._views.length - 1];
        const bounds = lastView.getBounds();
        lastView.setBounds({
          ...bounds,
          width: containerBounds.width - bounds.x,
        });
      }
    } else {
      const viewHeight = Math.ceil(containerBounds.height / this._views.length);
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
