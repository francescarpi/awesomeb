import { type VNode, h, c } from '#/scripts';
import type { IConfig, TWindowId } from '~/types';
import { renderSearchEngines } from './searchengines';

export function renderGeneralPage(winId: TWindowId, config: IConfig): VNode {
  return h('div', { class: c('flex', 'flex-col', 'gap-2') }, renderSearchEngines(winId, config));
}
