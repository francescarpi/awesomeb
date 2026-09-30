import { type VNode, h, btnIcon, c } from '#/scripts';
import type { IWindowState } from './types';
import type { TWindowId } from '~/types';
import BtnClose from '#/icons/close.svg?raw';
import BtnMinimize from '#/icons/down.svg?raw';
import BtnMaximize from '#/icons/up.svg?raw';
import BtnSidebar from '#/icons/sidebar.svg?raw';
import BtnNewTab from '#/icons/add-circle.svg?raw';
import BtnPerformCommand from '#/icons/command.svg?raw';
import { renderDesktops } from './desktops';
// import { renderTabContainers } from './tabcontainers';

export async function renderSidebar(
  winId: TWindowId,
  state: IWindowState,
  t: Record<string, string>,
): Promise<VNode> {
  return h(
    'div',
    {
      class: 'h-full flex flex-col gap-4 pt-0.5',
      style: 'app-region: drag;',
    },
    h(
      'section',
      {
        class: c('pl-2', state.sidebarCollapsed ? 'hidden' : 'flex justify-between items-center'),
        style: 'app-region: no-drag;',
      },
      h(
        'div',
        { class: 'gap-1 flex' },
        btnIcon(BtnClose, {
          classNames: ['text-white'],
          size: 4,
          onClick: () => abCommands.perform(winId, 'close-window'),
        }),
        btnIcon(BtnMinimize, {
          classNames: ['text-white'],
          size: 4,
          onClick: () => abCommands.perform(winId, 'minimize-window'),
        }),
        btnIcon(BtnMaximize, {
          classNames: ['text-white'],
          size: 4,
          onClick: () => abCommands.perform(winId, 'maximize-window'),
        }),
      ),
      renderUpdateButton(winId, state, t),
    ),
    h(
      'section',
      {
        class: c(state.sidebarCollapsed ? 'flex-col px-1' : 'flex px-2', 'items-center', 'gap-2'),
        style: 'app-region: no-drag;',
      },
      btnIcon(BtnSidebar, {
        classNames: ['text-white'],
        onClick: () => abCommands.perform(winId, 'toggle-sidebar'),
      }),
      btnIcon(BtnNewTab, {
        classNames: ['text-white', state.sidebarCollapsed ? 'hidden' : 'block'],
        onClick: () => abModal.open(winId, 'new-tab'),
      }),
      btnIcon(BtnPerformCommand, {
        classNames: ['text-white', state.sidebarCollapsed ? 'hidden' : 'block'],
        onClick: () => abModal.open(winId, 'perform-command'),
      }),
    ),
    h(
      'section',
      {
        class: c('py-1', 'justify-center', state.sidebarCollapsed ? 'flex' : 'block px-2'),
      },
      renderDesktops(state),
    ),
    h('section', { class: 'flex-1 overflow-y-auto bg-black', id: 'sidebar-tabcontainers' }),
  );
}

function renderUpdateButton(
  winId: TWindowId,
  state: IWindowState,
  t: Record<string, string>,
): VNode | null {
  if (!state.version || state.sidebarCollapsed) {
    return null;
  }

  if (state.version.status === 'available') {
    return h(
      'button',
      {
        class: c(
          'btn',
          'btn-xs',
          'btn-outline',
          'bg-white',
          'border-white',
          'text-black',
          'inline-flex',
        ),
        style: 'app-region: no-drag;',
        id: 'appupdater-info-btn',
        onclick: (e) => {
          const bounds = (e.target as HTMLButtonElement).getBoundingClientRect();
          abModal.openContextual(winId, 'contextual-app-updater', {
            bounds: {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            },
            anchor: 'top-left',
          });
        },
      },
      t['pages:window.updateAvailable'],
    );
  }

  if (state.version.status === 'downloaded') {
    return h(
      'button',
      {
        class: c(
          'btn',
          'btn-xs',
          'btn-outline',
          'bg-white',
          'border-white',
          'text-black',
          'inline-flex',
        ),
        style: 'app-region: no-drag;',
        onclick: () => {
          abAppUpdater.install(winId);
        },
      },
      t['pages:window.updateInstall'],
    );
  }

  if (state.version.status == 'downloading') {
    return h(
      'span',
      {
        class: c(
          'btn',
          'btn-xs',
          'btn-outline',
          'bg-white',
          'border-white',
          'text-black',
          'inline-flex',
        ),
      },
      t['pages:window.updateProgress'].replace('{{percent}}', state.version.progress.toFixed(0)),
    );
  }

  return null;
}
