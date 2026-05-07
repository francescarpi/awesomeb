import { LayoutBase } from './base';
import { Rectangle } from 'electron';
import { EIcon, getIcon } from '@/menu/utils';

export class LayoutVertical extends LayoutBase {
  public readonly id: string = 'vertical';
  public readonly label: string = 'Vertical';
  public readonly icon: string = getIcon(EIcon.Vertical);

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
