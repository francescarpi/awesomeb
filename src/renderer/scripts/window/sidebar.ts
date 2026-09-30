import type { TWindowId } from '~/types';
import { btnIcon, Renderer } from '#/scripts';
import BtnClose from '#/icons/close.svg?raw';
import BtnMinimize from '#/icons/down.svg?raw';
import BtnMaximize from '#/icons/up.svg?raw';
import BtnSidebar from '#/icons/sidebar.svg?raw';
import BtnNewTab from '#/icons/add-circle.svg?raw';
import BtnPerformCommand from '#/icons/command.svg?raw';

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

export function renderActions(winId: TWindowId, renderer: Renderer) {
  renderer.update([
    btnIcon(BtnSidebar, {
      classNames: ['text-white', 'group-[.collapsed]:mt-0.4', 'group-[.collapsed]:ml-2'],
      onClick: () => abCommands.perform(winId, 'toggle-sidebar'),
      key: 'toggle',
    }),
    btnIcon(BtnNewTab, {
      classNames: ['text-white', 'group-[.collapsed]:hidden'],
      onClick: () => abModal.open(winId, 'new-tab'),
      key: 'new-tab',
    }),
    btnIcon(BtnPerformCommand, {
      classNames: ['text-white', 'group-[.collapsed]:hidden'],
      onClick: () => abModal.open(winId, 'perform-command'),
      key: 'perform',
    }),
  ]);
}
