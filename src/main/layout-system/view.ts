import { WebContentsView, Rectangle, app } from 'electron';
import path from 'path';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';
import { LSLayoutNode } from './types';

export class LSView extends WebContentsView implements LSLayoutNode {
  constructor(
    page: string,
    public fixedSize?: { width?: number; height?: number },
  ) {
    super({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
      },
    });
    if (app.isPackaged) {
      this.webContents.loadFile(path.join(RENDERER_FOLDER, page, 'index.html'));
    } else {
      this.webContents.loadURL(`http://localhost:4321/${page}`);
    }
  }

  layout(rect: Rectangle) {
    const w = this.fixedSize?.width ?? rect.width;
    const h = this.fixedSize?.height ?? rect.height;

    this.setBounds({
      x: rect.x,
      y: rect.y,
      width: w,
      height: h,
    });
  }
}
