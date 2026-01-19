import { LSWindow, LSVerticalLayout, LSView, LSHorizontalLayout } from '@main/layout-system';
import type { IProps } from './types';

export class BrowserWindow extends LSWindow {
  constructor(props?: IProps) {
    super();

    this.enableAutoLayout();

    const root = new LSVerticalLayout();
    root.padding = 5;

    const sidebar = new LSView('sidebar', { width: 255 });

    const rightLayout = new LSHorizontalLayout();
    rightLayout.padding = 5;

    const urlbar = new LSView('urlbar', { height: 40 });
    const content = new LSView('main-view');

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
