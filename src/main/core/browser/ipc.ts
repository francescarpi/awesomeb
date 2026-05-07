import { Browser, Window } from '@/core';
import { createHandler, windowChecker, viewChecker, modalChecker } from '@/utils';
import { TEntityType } from '~/types';

export function setupBrowserIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; entity: TEntityType }>(
    'entities:fetch',
    'handle',
    browser,
    [windowChecker, [modalChecker, viewChecker.bind(null, ['sidebar', 'tab-switcher'])]],
    async ({ win, entity }) => {
      switch (entity) {
        case 'commands':
          return browser.renderer.commandsEntities();
        case 'desktops':
          return browser.renderer.desktopsEntities(win);
        case 'themes':
          return browser.renderer.themesEntities(win);
        case 'searchEngines':
          return browser.renderer.searchEnginesEntities();
        case 'partitions':
          return browser.renderer.partitionsEntities(browser);
        case 'targets':
          return browser.renderer.targetsEntities(browser, win);
        case 'tabs':
          return browser.renderer.tabsEntities(browser, win);
        case 'tabContainers':
          return browser.renderer.tabContainersEntities(win);
        case 'bookmarks':
          return browser.renderer.bookmarksEntities();
        case 'closedTabs':
          return browser.renderer.closedTabsEntities();
        case 'layouts':
          return browser.renderer.layoutsEntities(browser);
      }
    },
  );
}
