import { Browser, Window } from '@main/core';
import log from 'electron-log';

const scopeLog = log.scope('BrowserRendererEmmiter');

export class BrowserRendererEmmiter {
  constructor(private readonly _browser: Browser) {}

  refreshDesktops(window: Window) {
    const sidebar = window.getView('sidebar')!;
    const desktops = this._browser.renderer.desktops(window);
    sidebar.send('desktops:refresh', desktops);
    scopeLog.info('Desktops refreshed in renderer');
  }
}
