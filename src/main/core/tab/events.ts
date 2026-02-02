import { Tab } from './tab';

export function registerTabEvents(tab: Tab) {
  //--------------------------------------------------------------------------------------
  tab.view.webContents.on('did-start-loading', () => {
    tab.setLoading(true);
  });

  //--------------------------------------------------------------------------------------
  tab.view.webContents.on('did-stop-loading', () => {
    tab.setLoading(false);
  });

  //--------------------------------------------------------------------------------------
  tab.view.webContents.on('did-navigate', (_event, url, _httpResponseCode, _httpStatusText) => {
    tab.setUrl(url);
  });

  //--------------------------------------------------------------------------------------
  tab.view.webContents.on(
    'did-navigate-in-page',
    (_event, url, isMainFrame, _frameProcessId, _frameRoutingId) => {
      if (isMainFrame) {
        tab.setUrl(url);
      }
    },
  );
  //--------------------------------------------------------------------------------------
  tab.view.webContents.on('page-title-updated', (_event, title, _explicitSet) => {
    tab.setTitle(title);
  });
}
