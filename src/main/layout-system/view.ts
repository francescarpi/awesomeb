import { WebContentsView, Rectangle, app } from 'electron';
import path from 'path';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';
import { LSLayoutNode } from './types';
import { IMargins } from '@shared/types';

export class LSView extends WebContentsView implements LSLayoutNode {
  constructor(
    page: string,
    public props?: { width?: number; height?: number; margin?: IMargins },
  ) {
    super({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
      },
    });

    this.setBorderRadius(12);

    if (app.isPackaged) {
      this.webContents.loadFile(path.join(RENDERER_FOLDER, page, 'index.html'));
    } else {
      this.webContents.loadURL(`http://localhost:4321/${page}`);
    }
  }

  layout(rect: Rectangle) {
    this.setBounds(rect);
  }
}
