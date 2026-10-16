import { UIPageView } from '../view';
import { TWindowId } from '~/types';

export class Tooltip extends UIPageView {
  constructor(winId: TWindowId) {
    super('tooltip', {
      query: { winId: winId.toString() },
      visible: false,
    });
  }
}
