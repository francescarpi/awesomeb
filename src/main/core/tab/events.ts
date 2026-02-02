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
}
