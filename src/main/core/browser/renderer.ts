import { IEntity, IDesktopEntity } from '~/types';
import { Browser, getCommands, Window } from '@/core';

export class BrowserRenderer {
  constructor(private readonly _browser: Browser) {}

  commands(): IEntity[] {
    return getCommands(this._browser).map((cmd) => ({
      id: cmd.trigger,
      label: cmd.name,
      extra: cmd.description,
    }));
  }

  desktops(window: Window): IDesktopEntity[] {
    return window.desktops.map((desk) => ({
      id: desk.id.toString(),
      label: desk.label,
      selected: desk.id === window.selectedDesktop.id,
      requireAttention: desk.requireAttention,
      hasTabs: desk.hasTabs,
      hasActiveTabs: desk.hasActiveTabs,
      name: desk.name,
    }));
  }
}
