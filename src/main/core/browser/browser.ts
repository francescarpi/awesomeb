import { Window } from '@main/core';
import { TWindowId } from '@shared/types';
import { mainMenu } from '@main/menu';
import { Menu } from 'electron';

export class Browser {
  private readonly _windows: Map<TWindowId, Window> = new Map();

  async init() {
    await this.refreshMainMenu();
  }

  createWindow(): Window {
    const w = new Window();
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
}
