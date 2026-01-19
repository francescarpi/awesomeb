import { WebContentsView, Rectangle, app } from 'electron';
import path from 'path';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';
import { LSLayoutNode } from './types';

export class LSView extends WebContentsView implements LSLayoutNode {
  constructor(
    page: string,
    public props?: { width?: number; height?: number; margins?: [number, number, number, number] },
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
    const margins = this.props?.margins ?? [0, 0, 0, 0];
    const width = (this.props?.width ?? rect.width) - (margins[3] + margins[1]);
    const height = (this.props?.height ?? rect.height) - (margins[0] + margins[2]);
    const y = rect.y + margins[0];
    const x = rect.x + margins[3];
    this.setBounds({ x, y, width, height });
  }
}
