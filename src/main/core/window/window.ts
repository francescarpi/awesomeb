import { UIWindow, UIVerticalLayout, UIView, UIHorizontalLayout } from '@main/ui';
import type { IProps } from './types';
import { defaultTheme, Desktop } from '@main/core';
import EventEmitter from 'events';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH, MIN_DESKTOPS } from './constants';
import { TDesktopId } from '@shared/types';

export class Window extends UIWindow {
  private readonly _desktops: Map<TDesktopId, Desktop> = new Map();
  private _selectedDesktopId: number;

  constructor(
    public readonly eventsChannel: EventEmitter,
    props?: IProps,
  ) {
    super(eventsChannel, props?.theme || defaultTheme);

    this._selectedDesktopId = props?.selectedDesktopId || 1;

    if (props?.desktops) {
      for (const deskProps of props.desktops) {
        this._desktops.set(deskProps.id, deskProps);
      }
    } else {
      for (let i = 0; i < MIN_DESKTOPS; i++) {
        const desk = new Desktop(i + 1);
        this._desktops.set(desk.id, desk);
      }
    }

    this.buildLayout();
  }

  private buildLayout() {
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

  get desktops(): Desktop[] {
    return Array.from(this._desktops.values());
  }

  get selectedDesktop(): Desktop {
    return this._desktops.get(this._selectedDesktopId)!;
  }
}
