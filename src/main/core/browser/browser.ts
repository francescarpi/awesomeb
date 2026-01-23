import { getCommand, TCommandTrigger, Window } from '@main/core';
import { TWindowId } from '@shared/types';
import { mainMenu } from '@main/menu';
import { Menu, BrowserWindow } from 'electron';
import EventEmitter from 'events';
import { registerBrowserEvents } from './events';
import log from 'electron-log';
import { BrowserRenderer } from './renderer';

const scopeLog = log.scope('Browser');

export class Browser {
  private readonly _windows: Map<TWindowId, Window> = new Map();
  public readonly eventsChannel = new EventEmitter();
  public readonly renderer = new BrowserRenderer(this);

  constructor() {
    registerBrowserEvents(this);
  }

  async init() {
    await this.refreshMainMenu();
  }

  createWindow(): Window {
    const w = new Window(this.eventsChannel);
    this._windows.set(w.id, w);

    scopeLog.info(
      `Created window with id ${w.id} ` +
        `(Total windows: ${BrowserWindow.getAllWindows().length})`,
    );

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
    return true;
  }
}
