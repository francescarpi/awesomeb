import type { TWindowId, IDesktop } from '~/types';
import { btnIcon, Renderer, c, h, selectDesktopFromEvent, desktopMenuFromEvent } from '#/scripts';
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

export function renderDesktops(renderer: Renderer, desktops: IDesktop[]) {
  renderer.update(
    desktops.map((desktop) =>
      h(
        'div',
        {
          key: desktop.id,
          'data-desktop-id': String(desktop.id),
          class: c('group', 'relative', '[.selected]:block', desktop.selected && 'selected'),
        },
        h(
          'div',
          {
            class: c(
              'border',
              'rounded-full',
              'cursor-pointer',
              'items-center',
              'justify-center',
              'relative',
              'flex',
              'select-none',
              'overflow-hidden',
              'w-9',
              'h-9',
              'text-sm',
              'group-[.collapsed]:w-8.5',
              'group-[.collapsed]:h-8.5',
              'group-[.collapsed]:text-xs',
              desktop.requireAttention && 'bg-red-500/20 border-error',
            ),
            style: 'app-region: no-drag;',
            onclick: selectDesktopFromEvent,
            oncontextmenu: desktopMenuFromEvent,
          },
          h('div', {
            class: c(
              'pointer-events-none',
              'absolute',
              'inset-0',
              'rounded-full',
              'bg-white/20',
              'transition-opacity',
              'duration-200',
              'ease-out',
              'motion-reduce:transition-none',
              desktop.selected ? 'opacity-100' : 'opacity-0',
            ),
          }),
          h(
            'span',
            {
              class: c(
                desktop.selected &&
                  desktop.shortName &&
                  desktop.shortName.trim() !== '' &&
                  'hidden',
                desktop.shortName && desktop.shortName.trim() !== ''
                  ? 'sidebar-opened:group-hover:hidden'
                  : '',
              ),
            },
            desktop.id,
          ),
          h(
            'div',
            {
              class: c(
                'w-[3px]',
                'h-[3px]',
                'rounded-full',
                'absolute',
                'bottom-1',
                'left-1/2',
                '-translate-x-1/2',
                desktop.hasTabs && desktop.hasActiveTabs && 'bg-white',
                desktop.hasTabs && !desktop.hasActiveTabs && 'bg-white/20',
              ),
            },
            '',
          ),
          h(
            'div',
            {
              class: c(
                'group-[.collapsed]:text-[8px]',
                'text-[10px]',
                'absolute',
                'whitespace-nowrap',
                'left-1/2',
                '-translate-x-1/2',
                'sidebar-opened:hidden',
                desktop.shortName && desktop.shortName.trim() !== ''
                  ? 'sidebar-opened:group-[.selected]:block sidebar-opened:group-hover:block'
                  : '',
              ),
            },
            desktop.shortName || '',
          ),
        ),
      ),
    ),
  );
}
