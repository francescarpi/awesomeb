import { app } from 'electron';
import {
  Browser,
  setupCommandsIPC,
  setupBrowserIPC,
  setupDesktopIPC,
  setupWindowIPC,
  setupTabIPC,
  setupBookmarksIPC,
  setupProtocols,
  registerProtocols,
  setupOpenURLHistoryIpc,
  setupDownloadsIPC,
  setupFaviconsIpc,
  setupTabMarksIpc,
  setupCertificatesIPC,
  setupConfigIPC,
  setupExtensionsIPC,
  partitions,
} from '@/core';
import { setupUIIPC } from '@/ui';
import { setupLogs, setupAbout, setupFeatures } from './boot';
import { registerAppEvents } from './app.events';
import { setupMenuIPC } from '@/menu';
import electronDl from 'electron-dl';

export type { IModalProps } from './ui';

setupLogs();
setupAbout();
setupFeatures();
electronDl();
setupProtocols();

app.whenReady().then(async () => {
  partitions.init();

  const browser = new Browser();

  registerProtocols();

  registerAppEvents(browser);

  setupUIIPC(browser);
  setupCommandsIPC(browser);
  setupBrowserIPC(browser);
  setupDesktopIPC(browser);
  setupWindowIPC(browser);
  setupMenuIPC(browser);
  setupTabIPC(browser);
  setupBookmarksIPC(browser);
  setupOpenURLHistoryIpc(browser);
  setupDownloadsIPC(browser);
  setupFaviconsIpc(browser);
  setupTabMarksIpc(browser);
  setupCertificatesIPC(browser);
  setupConfigIPC(browser);
  setupExtensionsIPC(browser);

  await browser.loadSession();
});
