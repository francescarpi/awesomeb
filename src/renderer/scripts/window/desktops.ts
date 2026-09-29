import { type VNode, h, c, selectDesktopFromEvent, desktopMenuFromEvent } from '#/scripts';
import type { IWindowState } from './types';

export function renderDesktops(state: IWindowState): VNode {
  return h(
    'div',
    { class: 'grid grid-cols-1 sidebar-opened:grid-cols-5 items-center gap-2' },
    ...state.desktops.map((desktop) =>
      h(
        'div',
        {
          key: desktop.id,
          'data-desktop-id': String(desktop.id),
          class: c(
            state.sidebarCollapsed ? 'hidden' : 'block',
            'group',
            'relative',
            '[.selected]:block',
            desktop.selected && 'selected',
          ),
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
              state.sidebarCollapsed ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm',
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
                'text-[8px]',
                'sidebar-opened:text-[10px]',
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
