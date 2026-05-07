import { Rectangle } from 'electron';

export class LayoutBase {
  protected id: string = '';
  protected readonly MARGIN = 2;

  calculateBounds(_availableArea: Rectangle, _tabNumber: number): Rectangle {
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
  }
}
