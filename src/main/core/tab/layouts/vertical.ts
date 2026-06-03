import { LayoutBase } from './base';
import { Rectangle } from 'electron';
import { EIcon, getIcon } from '@/menu/utils';

export class LayoutVertical extends LayoutBase {
  public readonly id: string = 'vertical';
  public readonly label: string = 'Vertical';
  public readonly icon: string = getIcon(EIcon.Vertical);

  calculateBounds(
    availableArea: Rectangle,
    totalTabs: number,
    tabNumber: number,
    percentSize: number,
  ): Rectangle {
    const { x: ax, y: ay, width: totalWidth, height: totalHeight } = availableArea;
    const halfHeight = Math.round(totalHeight / 2);
    const primaryWidth = Math.round((totalWidth * percentSize) / 100);

    if (totalTabs === 1) {
      return {
        x: ax,
        y: ay,
        width: totalWidth - this.MARGIN,
        height: totalHeight,
      };
    }

    if (totalTabs === 2) {
      if (tabNumber === 1) {
        return { x: ax, y: ay, width: primaryWidth - this.MARGIN, height: totalHeight };
      }
      return {
        x: ax + primaryWidth + this.MARGIN,
        y: ay,
        width: totalWidth - primaryWidth - this.MARGIN,
        height: totalHeight,
      };
    }

    if (totalTabs === 3) {
      if (tabNumber === 1) {
        return {
          x: ax,
          y: ay,
          width: primaryWidth - this.MARGIN,
          height: halfHeight - this.MARGIN,
        };
      }
      if (tabNumber === 2) {
        return {
          x: ax + primaryWidth + this.MARGIN,
          y: ay,
          width: totalWidth - primaryWidth - this.MARGIN,
          height: halfHeight - this.MARGIN,
        };
      }
      return {
        x: ax,
        y: ay + halfHeight + this.MARGIN,
        width: totalWidth - this.MARGIN,
        height: totalHeight - halfHeight - this.MARGIN,
      };
    }

    const tabHeight = Math.round(totalHeight / totalTabs);
    return {
      x: ax,
      y: ay + (tabNumber - 1) * tabHeight,
      width: totalWidth - this.MARGIN,
      height: tabHeight - this.MARGIN,
    };
  }
}
