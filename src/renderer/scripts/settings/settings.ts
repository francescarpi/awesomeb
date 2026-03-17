import { initSearchEngines } from './searchengine';

export async function settingsManager(winId: number) {
  const config = await abConfig.get(winId);
  initSearchEngines(winId, config);
}
