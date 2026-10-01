import type { TWindowId, IDesktop, IDownloads } from '~/types';
import { btnIcon, Renderer, c, h, selectDesktopFromEvent, desktopMenuFromEvent } from '#/scripts';
import BtnClose from '#/icons/close.svg?raw';
import BtnMinimize from '#/icons/down.svg?raw';
import BtnMaximize from '#/icons/up.svg?raw';
import BtnSidebar from '#/icons/sidebar.svg?raw';
import BtnNewTab from '#/icons/add-circle.svg?raw';
import BtnPerformCommand from '#/icons/command.svg?raw';
import IdleIcon from '#/icons/downloads.svg?raw';
import AnimatedIcon from '#/icons/downloads-animated.svg?raw';

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
      classNames: [
        'text-white',
        'group-[.collapsed]/sidebar:mt-0.5',
        'group-[.collapsed]/sidebar:ml-2',
      ],
      onClick: () => abCommands.perform(winId, 'toggle-sidebar'),
      key: 'toggle',
    }),
    btnIcon(BtnNewTab, {
      classNames: ['text-white', 'group-[.collapsed]/sidebar:hidden'],
      onClick: () => abModal.open(winId, 'new-tab'),
      key: 'new-tab',
    }),
    btnIcon(BtnPerformCommand, {
      classNames: ['text-white', 'group-[.collapsed]/sidebar:hidden'],
      onClick: () => abModal.open(winId, 'perform-command'),
      key: 'perform',
    }),
  ]);
}

export function renderDesktops(renderer: Renderer, desktops: IDesktop[]) {
  renderer.update(
    desktops.map((desktop) => {
      const shortName =
        desktop.shortName && desktop.shortName.trim() !== '' ? desktop.shortName : '';

      const hasActiveTabs = desktop.hasTabs && desktop.hasActiveTabs;
      const hasNoActiveTabs = desktop.hasTabs && !desktop.hasActiveTabs;

      return h(
        'div',
        {
          key: desktop.id,
          'data-desktop-id': String(desktop.id),
          class: c(
            'group/desktop',
            'relative',
            'mb-2',
            desktop.selected ? 'selected' : `group-[.collapsed]/sidebar:hidden`,
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
              'w-9',
              'h-9',
              'text-sm',
              'group-[.collapsed]/sidebar:text-xs',
              'group-[.collapsed]/sidebar:w-8',
              'group-[.collapsed]/sidebar:h-8',
              'mx-auto',
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
                desktop.selected && shortName && 'hidden',
                shortName && 'group-hover/desktop:opacity-0',
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
                hasActiveTabs && 'bg-white',
                hasNoActiveTabs && 'bg-white/20',
              ),
            },
            '',
          ),
          h(
            'div',
            {
              class: c(
                'group-[.collapsed]/sidebar:text-[8px]',
                'text-[10px]',
                'whitespace-nowrap',
                'left-1/2',
                '-translate-x-1/2',
                'absolute',
                'opacity-0',
                'transition-opacity',
                'duration-200',
                'ease-out',
                'motion-reduce:transition-none',
                shortName
                  ? `group-[.selected]/desktop:opacity-100 group-hover/desktop:opacity-100`
                  : 'opacity-0',
              ),
            },
            shortName,
          ),
        ),
      );
    }),
  );
}

export function renderDownloadsButton(winId: TWindowId, renderer: Renderer, data?: IDownloads) {
  // const icon = completedFlash ? CompletedIcon : downloading ? AnimatedIcon : IdleIcon;
  const icon = data?.downloading ? AnimatedIcon : IdleIcon;
  renderer.update(
    h(
      'div',
      {
        style: 'app-region: no-drag;',
        class: 'relative select-none',
      },
      h(
        'span',
        {
          class: c(
            !data?.activeCount && 'hidden',
            'bg-error',
            'text-error-content',
            'w-3',
            'h-3',
            'text-[9px]',
            'rounded-full',
            'flex',
            'items-center',
            'justify-center',
            'absolute',
            '-top-2',
            '-right-1.5',
          ),
        },
        data?.activeCount,
      ),
      btnIcon(icon, {
        classNames: ['text-white' /*completedFlash && 'icon-bounce'*/],
        size: 5,
        id: 'downloads-icon',
        onClick: () => {
          const bounds = (
            document.getElementById('downloads-icon') as HTMLButtonElement
          ).getBoundingClientRect();
          abModal.openContextual(winId, 'contextual-downloads-modal', {
            bounds: {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            },
            anchor: 'bottom-left',
          });
        },
      }),
    ),
  );
}

export function renderWindowId(winId: TWindowId, renderer: Renderer) {
  renderer.update(h('div', { class: 'text-xs' }, `ID: ${winId}`));
}
