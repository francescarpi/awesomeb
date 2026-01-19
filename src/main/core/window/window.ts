import { LSWindow, LSLayout, LSView } from '@main/layout-system';
import type { IProps } from './types';

export class BrowserWindow extends LSWindow {
  constructor(props?: IProps) {
    super();

    const sidebar = new LSView('sidebar', { width: 255 });
    const mainView = new LSView('main-view');

    const layout = new LSLayout('vertical', [sidebar, mainView]);

    this.addLayout(layout);
  }
}
