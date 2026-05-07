import { LayoutBase } from './base';
import { Rectangle } from 'electron';
import { EIcon, getIcon } from '@/menu/utils';

export class LayoutHorizontal extends LayoutBase {
  public readonly id: string = 'horizontal';
  public readonly label: string = 'Horizontal';
  public readonly icon: string = getIcon(EIcon.Horizontal);

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
