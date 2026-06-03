import { LayoutBase } from './base';
import { Rectangle } from 'electron';
import { EIcon, getIcon } from '@/menu/utils';

export class LayoutHorizontal extends LayoutBase {
  public readonly id: string = 'horizontal';
  public readonly label: string = 'Horizontal';
  public readonly icon: string = getIcon(EIcon.Horizontal);

  calculateBounds(
    availableArea: Rectangle,
    totalTabs: number,
    tabNumber: number,
    percentSize: number,
  ): Rectangle {
    const { x: ax, y: ay, width: totalWidth, height: totalHeight } = availableArea;
    const halfWidth = Math.round(totalWidth / 2);
    const primaryHeight = Math.round((totalHeight * percentSize) / 100);

    if (totalTabs === 1) {
      return {
        x: ax,
        y: ay,
        width: totalWidth,
        height: totalHeight - this.MARGIN,
      };
    }

    if (totalTabs === 2) {
      if (tabNumber === 1) {
        return { x: ax, y: ay, width: totalWidth, height: primaryHeight - this.MARGIN };
      }
      return {
        x: ax,
        y: ay + primaryHeight + this.MARGIN,
        width: totalWidth,
        height: totalHeight - primaryHeight - this.MARGIN,
      };
    }

    if (totalTabs === 3) {
      if (tabNumber === 1) {
        return {
          x: ax,
          y: ay,
          width: halfWidth - this.MARGIN,
          height: primaryHeight - this.MARGIN,
        };
      }
      if (tabNumber === 2) {
        return {
          x: ax,
          y: ay + primaryHeight + this.MARGIN,
          width: halfWidth - this.MARGIN,
          height: totalHeight - primaryHeight - this.MARGIN,
        };
      }
      return {
        x: ax + halfWidth + this.MARGIN,
        y: ay,
        width: totalWidth - halfWidth - this.MARGIN,
        height: totalHeight - this.MARGIN,
      };
    }

    const tabWidth = Math.round(totalWidth / totalTabs);
    return {
      x: ax + (tabNumber - 1) * tabWidth,
      y: ay,
      width: tabWidth - this.MARGIN,
      height: totalHeight - this.MARGIN,
    };
  }
}
