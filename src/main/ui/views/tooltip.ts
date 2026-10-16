import { UIPageView } from '../view';
import { TWindowId } from '~/types';
import { Window } from '@/core';

const WIDTH = 300;
const HEIGHT = 300;

export class UITooltip extends UIPageView {
  constructor(winId: TWindowId, tooltip: string, x: number, y: number) {
    super('tooltip', {
      query: { winId: winId.toString(), tooltip },
    });
    this.setBounds({ x, y, width: WIDTH, height: HEIGHT });
  }

  refreshBounds(_window: Window) {}
}
