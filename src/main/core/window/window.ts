import { UIWindow } from '@/ui';
import type { IProps } from './types';
import { Desktop, IDesktopProps } from '@/core';
import EventEmitter from 'events';
import { MIN_DESKTOPS } from './constants';
import { IDesConTab, TDesktopId, TTabId } from '~/types';
import log from 'electron-log';
import { registerWindowEvents } from './events';
import { TViewId } from '@/ui/types';

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

  refreshVisibleTabView() {
    const visible: TViewId[] = [];
    const desktop = this.selectedDesktop;
    const tabContainer = desktop.selectedTabContainer;

    if (tabContainer) {
      for (const tab of tabContainer.tabs) {
        visible.push(tab.view.id);
      }
    }

    this.refreshTabContainerLayoutView(visible);
  }

  getTab(id: TTabId): IDesConTab | null {
    for (const desktop of this._desktops.values()) {
      const conTab = desktop.getTab(id);
      if (conTab) {
        return {
          desktop,
          tabContainer: conTab.tabContainer,
          tab: conTab.tab,
        };
      }
    }
    return null;
  }

  async selectTab(tabId: TTabId) {
    const result = this.getTab(tabId);
    if (!result) {
      return;
    }

    // If exist previous selected tab, we have to remove it from the browser window
    const selectedTabContainer = this.selectedDesktop.selectedTabContainer;
    if (selectedTabContainer) {
      this.removeFromTabContainerLayout(selectedTabContainer.layout);
    }

    const { desktop, tabContainer, tab } = result;

    this._selectedDesktopId = desktop.id;

    desktop.selectTabContainer(tabContainer.id);

    tabContainer.selectTab(tabId);

    if (tab.suspended) {
      // TODO caution, this is an async operation. What if it takes too long and the browser is closed?
      tab.resume();
    }

    this.addInTabContainerLayout(tabContainer.layout);
    this.refreshVisibleTabView();

    this.eventsChannel.emit(
      'window:selected-tab-did-change',
      this,
      this.selectedDesktop,
      tabContainer,
      tab,
    );
  }
}
