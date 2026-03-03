import { Browser, Tab, TabPreview } from '@/core';
import { checkModalAndPagesSender } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId, TEntityType } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('BrowserIPC');

export function setupBrowserIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('entities:fetch', async (event, winId: TWindowId, entity: TEntityType) => {
    scopeLog.info(`IPC Received: entities:fetch for window ID ${winId} and entity ${entity}`);
    return await checkModalAndPagesSender(
      event,
      browser,
      winId,
      ['sidebar', 'tab-switcher'],
      async (window) => {
        switch (entity) {
          case 'commands':
            return browser.renderer.commandsEntities();
          case 'desktops':
            return browser.renderer.desktopsEntities(window);
          case 'themes':
            return browser.renderer.themesEntities(window);
          case 'searchEngines':
            return browser.renderer.searchEnginesEntities();
          case 'partitions':
            return browser.renderer.partitionsEntities(browser);
          case 'targets':
            return browser.renderer.targetsEntities(browser, window);
          case 'tabs':
            return browser.renderer.tabsEntities(browser, window);
          case 'tabContainers':
            return browser.renderer.tabContainersEntities(window);
          case 'bookmarks':
            return browser.renderer.bookmarksEntities();
        }
      },
    );
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('browser:open-tab-preview', async (event, url: string) => {
    const parentTabData = browser.getTabByWebContentsId(event.sender.id);
    if (!parentTabData) {
      scopeLog.warn(`No tab found for webContents ID ${event.sender.id}`);
      return;
    }

    const tab = new Tab(browser, browser.idGenerator.nextTabId, {
      partition: parentTabData.tab.partition,
      url,
      suspended: false,
      parent: parentTabData.tab,
    });

    const tabPreview = new TabPreview(parentTabData.tab, tab);
    parentTabData.tab.setTabPreview(tabPreview);
  });
}
