import { app } from 'electron';

export function registerAppEvents() {
  //--------------------------------------------------------------------------------------
  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
      app.quit();
    }
  });
}
