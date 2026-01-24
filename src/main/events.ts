import { app } from 'electron';
import { Session, Browser } from '@/core';

export function registerAppEvents(browser: Browser) {
  //--------------------------------------------------------------------------------------
  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
      app.quit();
    }
  });

  // ----------------------------------------------------------------------------------------------- //
  app.on('before-quit', async (event) => {
    event.preventDefault();

    const session = new Session(browser);
    session.save();

    // browser.history.save(browser)
    app.exit(0);
  });
}
