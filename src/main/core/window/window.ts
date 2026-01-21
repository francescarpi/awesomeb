import { UIWindow, UIVerticalLayout, UIView, UIHorizontalLayout } from '@main/ui';
import type { IProps } from './types';
import { defaultTheme, Theme } from '@main/core';

export class Window extends UIWindow {
  public theme: Theme;

  constructor(props?: IProps) {
    const theme = props?.theme || defaultTheme;
    super(theme);
    this.theme = theme;

    const root = new UIVerticalLayout();

    const sidebar = new UIView('sidebar', {
      width: 255,
      margin: { l: 5, t: 5, r: 5, b: 5 },
      query: { winId: this.id.toString() },
    });

    const rightLayout = new UIHorizontalLayout();
    const urlbar = new UIView('urlbar', { height: 40, margin: { l: 0, t: 5, r: 5, b: 0 } });
    const content = new UIView('main-view', { margin: { l: 0, t: 5, r: 5, b: 5 } });

    rightLayout.add(urlbar);
    rightLayout.add(content);

    root.add(sidebar);
    root.add(rightLayout);

    this.setLayout(root);

    // this.modal.open('modal');
    // this.openModal('modal-2');

    // setTimeout(() => {
    //   this.notifications.show('INFO');
    //   setTimeout(() => {
    //     this.notifications.show('ERROR', 'error');
    //   }, 3000);
    // }, 1000);
  }
}
