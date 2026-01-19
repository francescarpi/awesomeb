import { LSWindow, LSVerticalLayout, LSView, LSHorizontalLayout } from '@main/layout-system';
import type { IProps } from './types';

export class BrowserWindow extends LSWindow {
  constructor(props?: IProps) {
    super();

    const root = new LSVerticalLayout();

    const sidebar = new LSView('sidebar', {
      width: 255,
      margin: { left: 5, top: 5, right: 5, bottom: 5 },
    });

    const rightLayout = new LSHorizontalLayout();

    const urlbar = new LSView('urlbar', {
      height: 40,
      margin: { left: 0, top: 5, right: 5, bottom: 0 },
    });

    const content = new LSView('main-view', { margin: { left: 0, top: 5, right: 5, bottom: 5 } });

    rightLayout.add(urlbar);
    rightLayout.add(content);

    root.add(sidebar);
    root.add(rightLayout);

    this.contentView.addChildView(sidebar);
    this.contentView.addChildView(content);
    this.contentView.addChildView(urlbar);

    this.setLayout(root);
  }
}
