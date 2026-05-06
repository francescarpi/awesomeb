import { Browser } from '@/core';
import { ipcMain } from 'electron';
import { TExtensionId, TWindowId, TPartitionId } from '~/types';
import log from 'electron-log';
import { checkInternalPage, checkModalAndPagesSender, checkExtensionSender } from '@/utils';

const scopeLog = log.scope('ExtensionsIPC');

export function setupExtensionsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('extensions:get', async (event, winId?: TWindowId) => {
    scopeLog.info('Getting extensions data', { winId });
    if (winId) {
      return await checkModalAndPagesSender(event, browser, winId, ['urlbar'], async (_window) => {
        return browser.renderer.extensions();
      });
    }
    return await checkInternalPage(event, browser, 'extensions', async (_window) => {
      return browser.renderer.extensions();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle('extensions:active', async (event, winId?: TWindowId) => {
    scopeLog.info('Getting active extensions data', { winId });
    if (winId) {
      return await checkModalAndPagesSender(event, browser, winId, ['urlbar'], async (_window) => {
        return browser.renderer.extensions(true);
      });
    }
    return await checkInternalPage(event, browser, 'extensions', async (_window) => {
      return browser.renderer.extensions(true);
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle('extensions:refresh', async (event) => {
    scopeLog.info('Refreshing extensions data');
    return await checkInternalPage(event, browser, 'extensions', async (_window) => {
      browser.extensions.refresh();
      return browser.renderer.extensions();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle('extensions:toggle', async (event, id: TExtensionId) => {
    scopeLog.info('Toggle extension', id);
    return await checkInternalPage(event, browser, 'extensions', async (_window) => {
      browser.extensions.toggle(id);
      return browser.renderer.extensions();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'extensions:open-popup',
    async (event, winId: TWindowId, extensionId: TExtensionId) => {
      scopeLog.info('Opening extension popup', { extensionId, winId });
      return await checkModalAndPagesSender(event, browser, winId, ['urlbar'], async (window) => {
        const selectedTab = window.selectedTab;
        if (!selectedTab) {
          scopeLog.warn('No selected tab found for window', { winId });
          return;
        }
        browser.extensions.openPopup(extensionId, window, selectedTab.tab.partition);
      });
    },
  );

  //--------------------------------------------------------------------------------------
  ipcMain.on('extensions:close-popup', async (event, winId: TWindowId) => {
    scopeLog.info('Closing extension popup', { winId });
    return await checkModalAndPagesSender(
      event,
      browser,
      winId,
      ['extension-popup-overlay'],
      async (window) => {
        browser.extensions.closePopup(window);
      },
    );
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'extensions:ini-popup',
    async (event, winId: TWindowId, width: number, height: number) => {
      return await checkModalAndPagesSender(
        event,
        browser,
        winId,
        ['extension-popup'],
        async (window) => {
          browser.extensions.iniPopup(window, width, height);
        },
      );
    },
  );

  // ----------------------------------------------------------------------------------------------- //
  ipcMain.handle(
    'extensions:crx-message',
    async (
      _event,
      winId: TWindowId,
      partitionId: TPartitionId,
      extensionId: TExtensionId,
      action: { method: string; args: Record<string, unknown> },
    ) => {
      scopeLog.info(
        `crx-message from extension ${extensionId} and partitionId: ${partitionId}:`,
        action.method,
        action.args,
      );
      return await checkExtensionSender(browser, winId, extensionId, async (window, extension) => {
        return await browser.extensions.chrome.dispatch(
          window,
          partitionId,
          extension.id,
          action.method,
          action.args,
        );
      });
    },
  );
}
