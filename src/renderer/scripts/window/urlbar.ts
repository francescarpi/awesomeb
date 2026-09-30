import { h, btnIcon, c, Renderer } from '#/scripts';
import type { TWindowId, IURLTabData, IExtension } from '~/types';
import BtnBack from '#/icons/back.svg?raw';
import BtnForward from '#/icons/forward.svg?raw';
import BtnReload from '#/icons/reload.svg?raw';
import BtnCancel from '#/icons/close.svg?raw';
import SafeIcon from '#/icons/safe.svg?raw';
import UnsafeIcon from '#/icons/unsafe.svg?raw';
import BtnCopy from '#/icons/copy.svg?raw';
import BtnSplit from '#/icons/split.svg?raw';
import BtnMenu from '#/icons/menu.svg?raw';

export function renderNavUrl(
  winId: TWindowId,
  renderer: Renderer,
  data: IURLTabData = {
    safe: false,
    url: '',
    loading: false,
    tabId: -1,
    canGoBack: false,
    canGoForward: false,
    hasURL: false,
    hasSplit: false,
  },
) {
  const showSafe = data.hasURL && !data.loading && data.safe;
  const showUnsafe = data.hasURL && !data.loading && !data.safe;

  renderer.update([
    ////////////////////////////////////////////////////////////////////////////
    // Navigation butons
    h(
      'div',
      { class: 'flex items-center gap-2 h-full' },
      h(
        'div',
        { class: 'flex items-center gap-2' },
        btnIcon(BtnBack, {
          classNames: ['text-white'],
          disabled: !data.canGoBack,
          onClick: () => abCommands.perform(winId, 'go-back'),
        }),
        btnIcon(BtnForward, {
          classNames: ['text-white'],
          disabled: !data.canGoForward,
          onClick: () => abCommands.perform(winId, 'go-forward'),
        }),
        data.loading
          ? btnIcon(BtnCancel, {
              classNames: ['text-white'],
              onClick: () => abCommands.perform(winId, 'stop-tab'),
            })
          : btnIcon(BtnReload, {
              classNames: ['text-white'],
              disabled: !data.hasURL,
              onClick: () => abCommands.perform(winId, 'reload-tab'),
            }),
      ),
    ),
    ////////////////////////////////////////////////////////////////////////////
    // Url box
    h(
      'div',
      { class: 'bg-white/10 rounded-lg flex-1 h-full pl-2 border border-white/15' },
      h(
        'div',
        { class: 'flex gap-2 items-center w-full h-full' },
        h('span', {
          class: c('loading', 'loading-spinner', 'loading-xs', !data.loading && 'hidden'),
        }),
        h('div', {
          innerHTML: SafeIcon,
          class: c(
            'w-4',
            'h-4',
            '[&>svg]:w-full',
            '[&>svg]:h-full',
            'cursor-pointer',
            'hover:bg-white/20',
            'hover:rounded',
            !showSafe && 'hidden',
          ),
          onclick: () => {
            if (data.safe) {
              abModal.open(winId, 'certificate-info');
            }
          },
        }),
        h('div', {
          innerHTML: UnsafeIcon,
          class: c(
            'w-4',
            'h-4',
            '[&>svg]:w-full',
            '[&>svg]:h-full',
            'text-error',
            !showUnsafe && 'hidden',
          ),
        }),
        h('input', {
          class: 'rounded-lg text-sm pr-2 cursor-pointer w-full outline-none',
          value: data.url,
          readonly: true,
          onclick: () => {
            if (data.hasURL) {
              abModal.open(winId, 'edit-url');
            } else {
              abModal.open(winId, 'new-tab');
            }
          },
        }),
      ),
    ),
    ////////////////////////////////////////////////////////////////////////////
    // Copy url button
    btnIcon(BtnCopy, {
      classNames: ['text-white'],
      disabled: !data.hasURL,
      onClick: () => abCommands.perform(winId, 'copy-url'),
    }),
    ////////////////////////////////////////////////////////////////////////////
    // Split menu button (if there is split view)
    btnIcon(BtnSplit, {
      classNames: ['text-white', data.hasSplit ? '' : 'hidden'],
      disabled: !data.hasURL,
      onClick: () => abMenu.contextMenu(winId, 'split'),
    }),
  ]);
}

export function renderExtensions(
  winId: TWindowId,
  renderer: Renderer,
  extensions: IExtension[] = [],
) {
  renderer.update(
    extensions.map((extension) =>
      h('img', {
        src: extension.icon,
        class: `w-5 h-5 rounded object-cover cursor-pointer p-0.5 border border-black/30 bg-white/80 hover:bg-white`,
        onclick: (e) => {
          const img = e.target as HTMLImageElement;
          const bounds = img.getBoundingClientRect();

          const y = Math.round(bounds.y);
          const x = Math.round(bounds.x);
          abExtensions.openPopup(winId, extension.id, x, y);
        },
      }),
    ),
  );
}

export function renderMenuButton(winId: TWindowId, renderer: Renderer) {
  renderer.update(
    btnIcon(BtnMenu, {
      classNames: ['text-white'],
      onClick: () => abMenu.contextMenu(winId, 'main'),
    }),
  );
}
