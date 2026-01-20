import { LSWindow, LSVerticalLayout, LSView, LSHorizontalLayout } from '@main/layout-system';
import type { IProps } from './types';

export class BrowserWindow extends LSWindow {
  constructor(_props?: IProps) {
    super();

    const root = new LSVerticalLayout();

    const sidebar = new LSView('sidebar', { width: 255, margin: { l: 5, t: 5, r: 5, b: 5 } });

    const rightLayout = new LSHorizontalLayout();
    const urlbar = new LSView('urlbar', { height: 40, margin: { l: 0, t: 5, r: 5, b: 0 } });
    const content = new LSView('main-view', { margin: { l: 0, t: 5, r: 5, b: 5 } });

    rightLayout.add(urlbar);
    rightLayout.add(content);

    root.add(sidebar);
    root.add(rightLayout);

    this.setLayout(root);

    // this.openModal('modal');
    // this.openModal('modal-2');

    this.showNotification('This is an info notification.');
    // this.showNotification('This is a warning notification.', 'warning');
    // this.showNotification('This is an error notification.', 'error');
  }
}
