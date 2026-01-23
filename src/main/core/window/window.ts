import { UIWindow, UIVerticalLayout, UIView, UIHorizontalLayout } from '@main/ui';
import type { IProps } from './types';
import { defaultTheme } from '@main/core';
import EventEmitter from 'events';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH } from './constants';

export class Window extends UIWindow {
  constructor(
    public readonly eventsChannel: EventEmitter,
    props?: IProps,
  ) {
    super(eventsChannel, props?.theme || defaultTheme);

    const root = new UIVerticalLayout();

    const sidebar = new UIView('sidebar', {
      width: SIDEBAR_DEFAULT_WIDTH,
      margin: { l: 5, t: 5, r: 5, b: 5 },
      query: { winId: this.id.toString() },
    });

    const rightLayout = new UIHorizontalLayout();
    const urlbar = new UIView('urlbar', { height: 32, margin: { l: 0, t: 5, r: 5, b: 0 } });
    const content = new UIView('main-view', { margin: { l: 0, t: 5, r: 5, b: 5 } });

    rightLayout.add(urlbar);
    rightLayout.add(content);

    root.add(sidebar);
    root.add(rightLayout);

    this.setLayout(root);
  }

  toggleSidebar() {
    const view = this.getView('sidebar')!;
    if (view.width === SIDEBAR_DEFAULT_WIDTH) {
      view.setWidth(SIDEBAR_MIN_WIDTH);
    } else {
      view.setWidth(SIDEBAR_DEFAULT_WIDTH);
    }

    this.refreshLayout();
  }
}
