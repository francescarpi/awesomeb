import { UIWindow, UIVerticalLayout, UIView, UIHorizontalLayout } from '@/ui';
import type { IProps } from './types';
import { defaultTheme, Desktop } from '@/core';
import EventEmitter from 'events';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH, MIN_DESKTOPS } from './constants';
import { TDesktopId } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('Window');

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
    // TODO if area is maximized, sidebar should appear over the main view

    const sidebar = this.getView('sidebar')!;
    if (sidebar.width === SIDEBAR_DEFAULT_WIDTH) {
      sidebar.setWidth(SIDEBAR_MIN_WIDTH);
    } else {
      sidebar.setWidth(SIDEBAR_DEFAULT_WIDTH);
    }

    this.refreshLayout();
  }

  get isSidebarCollapsed(): boolean {
    const sidebar = this.getView('sidebar')!;
    return sidebar.width === SIDEBAR_MIN_WIDTH;
  }

  toggleMaximizeArea() {
    const urlbar = this.getView('urlbar')!;
    const sidebar = this.getView('sidebar')!;
    const mainView = this.getView('main-view')!;

    if (urlbar.isVisible) {
      urlbar.hide();
      sidebar.hide();
      mainView.setMargins({ l: 5 });
    } else {
      urlbar.show();
      sidebar.show();
      mainView.setMargins({ l: 0 });
    }

    this.refreshLayout();
  }

  get isAreaMaximized(): boolean {
    const urlbar = this.getView('urlbar')!;
    return !urlbar.isVisible;
  }

  get desktops(): Desktop[] {
    return Array.from(this._desktops.values());
  }

  get selectedDesktop(): Desktop {
    return this._desktops.get(this._selectedDesktopId)!;
  }

  goDesktop(target: 'next' | 'prev' | TDesktopId) {
    const deskIds = Array.from(this._desktops.keys()).sort((a, b) => a - b);
    const currentIndex = deskIds.indexOf(this._selectedDesktopId);

    let newIndex: number;

    if (target === 'next') {
      newIndex = (currentIndex + 1) % deskIds.length;
    } else if (target === 'prev') {
      newIndex = (currentIndex - 1 + deskIds.length) % deskIds.length;
    } else {
      newIndex = deskIds.indexOf(target);
      if (newIndex === -1) {
        scopeLog.warn(`Attempted to go to invalid desktop ID: ${target}`);
        return; // Invalid desktop id
      }
    }

    this._selectedDesktopId = deskIds[newIndex];
    this.eventsChannel.emit('window:selected-desktop-did-change', this, this._selectedDesktopId);
  }
}
