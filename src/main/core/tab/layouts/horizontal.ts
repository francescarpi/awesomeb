import { LayoutBase } from './base';
import { Rectangle } from 'electron';

export class LayoutHorizontal extends LayoutBase {
  id: string = 'horizontal';

  calculateBounds(availableArea: Rectangle, tabNumber: number): Rectangle {
    const x = availableArea.x;
    const y = tabNumber === 1 ? 0 : availableArea.height / 2 + this.MARGIN;

    const width = availableArea.width;
    const height = availableArea.height / 2 - this.MARGIN;

    return {
      x,
      y: availableArea.y + y,
      width,
      height,
    };
  }
}
