import type { TWindowId } from '~/types';
import { btnIcon, Renderer } from '#/scripts';
import BtnClose from '#/icons/close.svg?raw';
import BtnMinimize from '#/icons/down.svg?raw';
import BtnMaximize from '#/icons/up.svg?raw';

export function renderWindowButtons(winId: TWindowId, renderer: Renderer) {
  renderer.update([
    btnIcon(BtnClose, {
      classNames: ['text-white'],
      size: 4,
      onClick: () => abCommands.perform(winId, 'close-window'),
      key: 'close',
    }),
    btnIcon(BtnMinimize, {
      classNames: ['text-white'],
      size: 4,
      onClick: () => abCommands.perform(winId, 'minimize-window'),
      key: 'minimize',
    }),
    btnIcon(BtnMaximize, {
      classNames: ['text-white'],
      size: 4,
      onClick: () => abCommands.perform(winId, 'maximize-window'),
      key: 'maximize',
    }),
  ]);
}
