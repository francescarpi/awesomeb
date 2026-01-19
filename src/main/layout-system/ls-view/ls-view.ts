import { WebContentsView, app } from 'electron';
import path from 'path';
import { PRELOAD_FOLDER, RENDERER_FOLDER } from '@main/utils';

export class LSView extends WebContentsView {
  constructor(id: string) {
    super({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(PRELOAD_FOLDER, 'browser.js'),
      },
    });

    if (app.isPackaged) {
      this.webContents.loadFile(path.join(RENDERER_FOLDER, id, 'index.html'));
    } else {
      this.webContents.loadURL(`http://localhost:4321/${id}`);
    }

    this.setBounds({ x: 0, y: 0, width: 400, height: 400 });
  }
}
