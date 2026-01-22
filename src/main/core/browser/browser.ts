import { Window } from '@main/core';
import { TWindowId } from '@shared/types';
import { mainMenu } from '@main/menu';
import { Menu, BrowserWindow, app } from 'electron';
import EventEmitter from 'events';
import { registerBrowserEvents } from './events';

export class Browser {
  private readonly _windows: Map<TWindowId, Window> = new Map();
  public readonly eventsChannel = new EventEmitter();

  constructor() {
    registerBrowserEvents(this);
  }

  async init() {
    await this.refreshMainMenu();
  }

  createWindow(): Window {
    const w = new Window(this.eventsChannel);
    this._windows.set(w.id, w);
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

  getFocusedWindow(): Window | null {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    return focusedWindow ? this.getWindowById(focusedWindow.id as TWindowId) : null;
  }
}
