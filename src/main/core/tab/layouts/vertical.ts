import { LayoutBase } from './base';
import { Rectangle } from 'electron';

export class LayoutVertical extends LayoutBase {
  id: string = 'vertical';

  calculateBounds(availableArea: Rectangle, tabNumber: number): Rectangle {
    const x = tabNumber === 1 ? 0 : availableArea.width / 2 + this.MARGIN;
    const y = availableArea.y;

    const width = availableArea.width / 2 - this.MARGIN;
    const height = availableArea.height;

    return {
      x: availableArea.x + x,
      y,
      width,
      height,
    };
  }
}
