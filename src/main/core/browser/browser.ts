import { BrowserWindow } from '@main/core';
import { TWindowId } from '@shared/types';

export class Browser {
  private readonly _windows: Map<TWindowId, BrowserWindow> = new Map();

  init() {}

  createWindow(): BrowserWindow {
    const w = new BrowserWindow();
    this._windows.set(w.id, w);
    return w;
  }

  get windows(): BrowserWindow[] {
    return Array.from(this._windows.values());
  }

  getWindowById(id: TWindowId): BrowserWindow | null {
    return this._windows.get(id) || null;
  }
}
