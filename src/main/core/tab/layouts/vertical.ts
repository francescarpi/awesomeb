import { LayoutBase } from './base';
import { Rectangle } from 'electron';
import { EIcon, getIcon } from '@/menu/utils';

export class LayoutVertical extends LayoutBase {
  public readonly id: string = 'vertical';
  public readonly label: string = 'Vertical';
  public readonly icon: string = getIcon(EIcon.Vertical);

  calculateBounds(availableArea: Rectangle, tabNumber: number, percentSize: number): Rectangle {
    const totalWidth = availableArea.width;

    const pos1Width = Math.round((totalWidth * percentSize) / 100);
    const splitPos = pos1Width;

    const x = tabNumber === 1 ? 0 : splitPos + this.MARGIN;
    const y = availableArea.y;

    const width = tabNumber === 1 ? splitPos - this.MARGIN : totalWidth - splitPos - this.MARGIN;
    const height = availableArea.height;

    return {
      x: availableArea.x + x,
      y,
      width,
      height,
    };
  }
}
