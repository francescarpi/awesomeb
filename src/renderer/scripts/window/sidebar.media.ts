import { btnIcon, Renderer, h } from '#/scripts';
import Pause from '#/icons/pause.svg?raw';
import Muted from '#/icons/muted.svg?raw';
import Unmuted from '#/icons/unmuted.svg?raw';
import Play from '#/icons/play.svg?raw';
import type { IMediaSession, TWindowId } from '~/types';

export function renderMediaSession(
  winId: TWindowId,
  renderer: Renderer,
  data: IMediaSession | null,
) {
  if (!data) {
    renderer.update(h('div', {}));
    return;
  }

  renderer.update(
    h(
      'div',
      {
        class: 'bg-white/30 rounded mx-2 flex flex-col gap-1',
      },
      h(
        'div',
        {
          class:
            'flex gap-2 items-center select-none justify-between group-[.collapsed]/sidebar:flex-col group-[.collapsed]/sidebar:border-none border-b border-white/20 group-[.collapsed]/sidebar:px-0 px-2 py-1',
          style: 'app-region: no-drag',
        },
        h('img', {
          src: data.favicon,
          class: 'w-4 h-4 hover:opacity-70 cursor-pointer',
          onclick: () => {
            abCommands.perform(winId, 'select-tab', { tabId: data.tabId });
          },
        }),
        btnIcon(Pause, {
          classNames: ['text-white', data.playbackState === 'playing' ? '' : 'hidden'],
          size: 5,
          onClick: () => abMedia.action(winId, data.tabId, 'pause'),
        }),
        btnIcon(Play, {
          classNames: ['text-white', data.playbackState === 'paused' ? '' : 'hidden'],
          size: 5,
          onClick: () => abMedia.action(winId, data.tabId, 'play'),
        }),
        btnIcon(Unmuted, {
          classNames: ['text-white', !data.muted ? '' : 'hidden'],
          size: 5,
          onClick: () => abMedia.action(winId, data.tabId, 'toggleMute'),
        }),
        btnIcon(Muted, {
          classNames: ['text-white', data.muted ? '' : 'hidden'],
          size: 5,
          onClick: () => abMedia.action(winId, data.tabId, 'toggleMute'),
        }),
      ),
      h(
        'div',
        {
          class: 'group-[.collapsed]/sidebar:hidden flex-col flex px-2 pb-1',
        },
        h(
          'div',
          { class: 'overflow-hidden' },
          h(
            'span',
            { class: 'text-sm inline-block whitespace-nowrap', id: 'tabinfo-title' },
            data.title,
          ),
        ),
        h(
          'p',
          { class: 'text-xs truncate' },
          `${data.album ? data.album + '-' : ''}${data.artist}`,
        ),
      ),
    ),
  );
}
