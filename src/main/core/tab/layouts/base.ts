import { Rectangle } from 'electron';
import { EIcon, getIcon } from '@/menu/utils';

export class LayoutBase {
  public readonly id: string = 'base';
  public readonly label: string = 'Basae';
  public readonly icon: string = getIcon(EIcon.Divider);

  protected readonly MARGIN = 2;

  calculateBounds(_availableArea: Rectangle, _tabNumber: number, _percentSize: number): Rectangle {
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
  }
}
