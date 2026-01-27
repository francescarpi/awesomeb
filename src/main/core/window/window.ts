import {
  UIWindow,
  UIVerticalLayout,
  UIPageView,
  UIHorizontalLayout,
  UINewLayout,
  UINewPageView,
} from '@/ui';
import type { IProps } from './types';
import { Desktop, IDesktopProps } from '@/core';
import EventEmitter from 'events';
import { MIN_DESKTOPS, SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH } from './constants';
import { TDesktopId } from '~/types';
import log from 'electron-log';
import { registerWindowEvents } from './events';

const scopeLog = log.scope('Window');

export class Window extends UIWindow {
  private readonly _desktops: Map<TDesktopId, Desktop> = new Map();
  private _selectedDesktopId: number;

  constructor(
    public readonly eventsChannel: EventEmitter,
    props?: IProps,
  ) {
    super(eventsChannel, props?.bounds);

    registerWindowEvents(this);

    this._selectedDesktopId = props?.selectedDesktopId || 1;

    this.buildLayout();
  }

  private buildLayout() {
    const mainLayout = new UINewLayout('main-layout', 'vertical');
    this.setRootLayout(mainLayout);

    const sidebar = new UINewPageView('sidebar', {
      width: SIDEBAR_DEFAULT_WIDTH,
      query: { winId: this.id.toString() },
      margins: '5',
    });

    const urlbar = new UINewPageView('urlbar', {
      height: 32,
      query: { winId: this.id.toString() },
      margins: '5 5 0 0',
    });

    const noTab = new UINewPageView('no-tab', {
      margins: '5 5 5 0',
    });

    const urlbarWebviewLayout = new UINewLayout('urlbar-and-tab', 'horizontal');

    urlbarWebviewLayout.addChild(urlbar);
    urlbarWebviewLayout.addChild(noTab);

    mainLayout.addChild(sidebar);
    mainLayout.addChild(urlbarWebviewLayout);

    this.render();
  }

  toggleSidebar() {
    // TODO if area is maximized, sidebar should appear over the main view

    const sidebar = this.getNode<UIPageView>('sidebar')!;
    if (sidebar.width === SIDEBAR_DEFAULT_WIDTH) {
      sidebar.setWidth(SIDEBAR_MIN_WIDTH);
    } else {
      sidebar.setWidth(SIDEBAR_DEFAULT_WIDTH);
    }

    this.refreshLayoutDeprecated();
  }

  get isSidebarCollapsed(): boolean {
    const sidebar = this.getNode<UIPageView>('sidebar')!;
    return sidebar.width === SIDEBAR_MIN_WIDTH;
  }

  toggleMaximizeArea() {
    const urlbar = this.getNode<UIPageView>('urlbar')!;
    const sidebar = this.getNode<UIPageView>('sidebar')!;
    const mainView = this.getNode<UIPageView>('main-view')!;

    if (urlbar.isVisible) {
      urlbar.hide();
      sidebar.hide();
      mainView.setMargins({ l: 5 });
    } else {
      urlbar.show();
      sidebar.show();
      mainView.setMargins({ l: 0 });
    }

    this.refreshLayoutDeprecated();
  }

  get isAreaMaximized(): boolean {
    const urlbar = this.getNode<UIPageView>('urlbar')!;
    return !urlbar.isVisible;
  }

  get desktops(): Desktop[] {
    return Array.from(this._desktops.values());
  }

  getDesktop(id: TDesktopId): Desktop | null {
    return this._desktops.get(id) || null;
  }

  get selectedDesktop(): Desktop {
    return this._desktops.get(this._selectedDesktopId)!;
  }

  selectDesktop(target: 'next' | 'prev' | TDesktopId): Desktop | null {
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
        return null;
      }
    }

    this._selectedDesktopId = deskIds[newIndex];
    this.eventsChannel.emit('window:selected-desktop-did-change', this, this.selectedDesktop);

    return this.selectedDesktop;
  }

  createDesktop(id: TDesktopId, props?: IDesktopProps): Desktop {
    const newDesktop = new Desktop(this.eventsChannel, this, id, props);
    this._desktops.set(id, newDesktop);
    return newDesktop;
  }

  createDefaultDesktops() {
    for (let numDesktop = 0; numDesktop < MIN_DESKTOPS; numDesktop++) {
      this.createDesktop(numDesktop + 1);
    }
  }

  addToMainView(layout: UIVerticalLayout | UIHorizontalLayout) {
    const mainView = this.getNode<UIPageView>('main-view')!;
    mainView.hide();

    const rightContainer = this.getNode<UIHorizontalLayout>('urlbar-webview')!;
    rightContainer.add(layout);

    for (const view of layout.views) {
      this.bw.contentView.addChildView(view.wcv, 0);
    }

    this.refreshLayoutDeprecated();
  }
}
