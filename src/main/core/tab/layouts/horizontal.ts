import { LayoutBase } from './base';
import { Rectangle } from 'electron';
import { EIcon, getIcon } from '@/menu/utils';

export class LayoutHorizontal extends LayoutBase {
  public readonly id: string = 'horizontal';
  public readonly label: string = 'Horizontal';
  public readonly icon: string = getIcon(EIcon.Horizontal);

  calculateBounds(availableArea: Rectangle, tabNumber: number, percentSize: number): Rectangle {
    const totalHeight = availableArea.height;

    const pos1Height = Math.round((totalHeight * percentSize) / 100);
    const splitPos = pos1Height;

    const x = availableArea.x;
    const y = tabNumber === 1 ? 0 : splitPos + this.MARGIN;

    const width = availableArea.width;
    const height = tabNumber === 1 ? splitPos - this.MARGIN : totalHeight - splitPos - this.MARGIN;

    return {
      x,
      y: availableArea.y + y,
      width,
      height,
    };
  }
}
