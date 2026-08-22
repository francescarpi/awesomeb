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
  setupDownloadsIPC,
  setupFaviconsIpc,
  setupTabMarksIpc,
  setupCertificatesIPC,
  setupConfigIPC,
  setupExtensionsIPC,
  partitions,
  setupPromptsIpc,
  registerSessionEvents,
  loadExtensionToSession,
  setupWebauthIpc,
  setupPermissionsIPC,
  setupShortcutsIPC,
  setupVisitHistoryIPC,
  config,
  setupWelcomeIPC,
  clearExpiredClosedTabs,
  setupMediaIPC,
  setupAppUpdaterIPC,
} from '@/core';
import { setupUIIPC } from '@/ui';
import { setupLogs, setupAbout, setupFeatures } from './boot';
import { registerAppEvents } from './app.events';
import { setupMenuIPC } from '@/menu';
import electronDl from 'electron-dl';
import { initI18n } from '~/i18n';

export type { IModalProps } from './ui';

setupLogs();
setupAbout();
setupFeatures();
electronDl();
setupProtocols();

app.whenReady().then(async () => {
  await initI18n();

  partitions.init();

  const browser = new Browser();
  const extPromises = new Set<Promise<void>>();

  for (const partition of partitions.allForExtensions) {
    registerSessionEvents(browser, partition.ses);
    for (const ext of browser.extensions.active) {
      extPromises.add(loadExtensionToSession(partition.ses, ext));
    }
  }

  await Promise.all(extPromises);

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
  setupVisitHistoryIPC(browser);
  setupDownloadsIPC(browser);
  setupFaviconsIpc(browser);
  setupTabMarksIpc(browser);
  setupCertificatesIPC(browser);
  setupConfigIPC(browser);
  setupExtensionsIPC(browser);
  setupPromptsIpc(browser);
  setupWebauthIpc(browser);
  setupPermissionsIPC(browser);
  setupShortcutsIPC(browser);
  setupWelcomeIPC(browser);
  setupMediaIPC(browser);
  setupAppUpdaterIPC(browser);

  if (config.wasConfigured) {
    await browser.loadSession();
  } else {
    browser.showWelcome();
  }

  setTimeout(() => clearExpiredClosedTabs(browser), 5000);
});
