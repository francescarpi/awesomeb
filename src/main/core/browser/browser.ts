import {
  getCommand,
  TCommandTrigger,
  Window,
  Session,
  IWindowProps,
  getTheme,
  TabContainer,
  getPartitions,
  defaultPartition,
} from '@/core';
import { IWinDesConTab, TTabContainerId, TWindowId } from '~/types';
import { mainMenu } from '@/menu';
import { Menu, BrowserWindow } from 'electron';
import EventEmitter from 'events';
import { registerBrowserEvents } from './events';
import log from 'electron-log';
import { BrowserRenderer } from './renderer';
import { BrowserRendererEmmiter } from './renderer.emmiter';
import { IOpenUrlProps } from './types';
import { parseQuery, parseTarget } from './helpers';

const scopeLog = log.scope('Browser');

export class Browser {
  private readonly _windows: Map<TWindowId, Window> = new Map();
  private _activeWindowId: TWindowId | null = null;
  public readonly eventsChannel = new EventEmitter();
  public readonly renderer = new BrowserRenderer(this);
  public readonly rendererEmmiter = new BrowserRendererEmmiter(this);

  constructor() {
    registerBrowserEvents(this);
  }

  async loadSession() {
    const session = new Session(this);

    if (session.windows.length === 0) {
      const newWindow = this.createWindow();
      newWindow.createDefaultDesktops();
      await this.refreshMainMenu();
      return;
    }

    for (const winStore of session.windows) {
      const newWindow = this.createWindow({
        // bounds: winStore.bounds,
        bounds: { x: 0, y: 0, width: 1000, height: 1000 },
      });

      const partitions = getPartitions();

      for (const [deskIdx, deskStore] of winStore.desktops.entries()) {
        const theme = getTheme(deskStore.theme);
        const { name } = deskStore;

        const desktop = newWindow.createDesktop(deskIdx + 1, { theme, name });

        for (const tabConStore of deskStore.tabContainers) {
          const tabContainer = new TabContainer(this.eventsChannel, this.nextTabContainerId, {
            divider: tabConStore.divider,
          });

          desktop.addTabContainer(tabContainer);

          for (const tabStore of tabConStore.tabs) {
            const partition = partitions.get(tabStore.partitionId) || defaultPartition;
            tabContainer.createTab({
              partition,
              title: tabStore.title,
              customTitle: tabStore.customTitle,
              url: tabStore.url,
            });
          }
        }
      }
    }

    await this.refreshMainMenu();
  }

  createWindow(props?: IWindowProps): Window {
    const w = new Window(this.eventsChannel, props);
    this._windows.set(w.id, w);

    scopeLog.info(
      `Created window with id ${w.id} ` +
        `(Total windows: ${BrowserWindow.getAllWindows().length})`,
    );

    this._activeWindowId = w.id;

    return w;
  }

  get windows(): Window[] {
    return Array.from(this._windows.values());
  }

  getWindowById(id: TWindowId): Window | null {
    return this._windows.get(id) || null;
  }

  async refreshMainMenu() {
    const items = await mainMenu(this, false);
    Menu.setApplicationMenu(items);
  }

  setActiveWindowId(id: TWindowId | null) {
    this._activeWindowId = id;
  }

  get activeWindow(): Window | null {
    if (this._activeWindowId === null) {
      return null;
    }
    return this.getWindowById(this._activeWindowId);
  }

  performCommand(
    window: Window,
    trigger: TCommandTrigger,
    params?: Record<string, unknown>,
  ): boolean {
    const command = getCommand(trigger);
    if (!command) {
      scopeLog.error(`Command not found for trigger: ${trigger}`);
      return false;
    }
    command.handler(this, window, params);
    this.refreshMainMenu();
    return true;
  }

  get nextTabContainerId(): TTabContainerId {
    let maxId = 0;
    for (const window of this._windows.values()) {
      for (const desktop of window.desktops) {
        for (const tabContainer of desktop.tabContainers) {
          if (tabContainer.id > maxId) {
            maxId = tabContainer.id;
          }
        }
      }
    }
    return (maxId + 1) as TTabContainerId;
  }

  openURL(query: string, props?: IOpenUrlProps): IWinDesConTab | null {
    scopeLog.info(`Opening URL with query: ${query}`);

    const url = parseQuery(query, props?.searchEngineCode);
    if (!url) {
      scopeLog.error(`Invalid URL or query provided: ${query}`);
      return null;
    }

    const result = parseTarget(this, props?.targetId);

    if (!result) {
      scopeLog.error('Invalid target for opening URL');
      return null;
    }

    const { window, desktop, tabContainer, partition } = result;
    const tab = tabContainer.createTab({ partition });

    tab.loadURL(url);

    desktop.addTabContainer(tabContainer);
    desktop.selectTabContainer(tabContainer.id);

    window.addToTabContainerLayout(tabContainer.layout);
    window.refreshVisibleTabView();

    return { window, desktop, tabContainer, tab };
  }
}
