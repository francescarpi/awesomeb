import { type VNode, btnIcon, Renderer, c, h } from '#/scripts';
import type { ITabContainer, TWindowId, ITab } from '~/types';
import TabPreview from '#/icons/tab-preview.svg?raw';
import Muted from '#/icons/muted.svg?raw';
import Favicon from '#/icons/favicon.svg';
import Minus from '#/icons/minus.svg?raw';
import Close from '#/icons/close.svg?raw';
import Warning from '#/icons/warning.svg?raw';
import { tabDragStart, tabDragOver, tabDragLeave, tabDrop, tabDragEnd } from './sidebar.drag';

const tabMemo = new WeakMap<ITab, VNode>();

export async function renderTabContainers(
  winId: TWindowId,
  renderer: Renderer,
  tabContainers: ITabContainer[],
) {
  renderer.update(
    await Promise.all(
      tabContainers.map(async (tc) => {
        const childrenCount = tc.children.filter((t) => !t.isClosed).length;
        const r = await abI18n.t({ winId }, [
          { key: 'pages:tabContainers.collapsedTabs', params: { count: childrenCount } },
        ]);

        const collapsedText = r['pages:tabContainers.collapsedTabs'];

        return h(
          'div', // Tab Container
          {
            key: tc.id,
            'data-tab-container-id': String(tc.id),
            class: c(
              'hidden',
              tc.isClosed ? 'hidden' : `group-[.desktop${tc.desktopId}]:flex`,
              tc.divider && 'border-b border-white/20 border-dashed pb-1.5',
              'flex-col',
              'relative',
            ),
            style: 'app-region: no-drag',
          },
          h(
            'div',
            {
              class: 'items-start gap-1 flex',
            },
            h(
              'span', // Tab container shortcut (is a number between 1 and 9)
              {
                class:
                  'text-xs mx-0.5 mt-1.5 text-white/20 group-[.collapsed]/sidebar:hidden w-1.5',
              },
              tc.shortcut?.toString(),
            ),
            h(
              'div', // Tab container's tabs list (in vertical)
              {
                class: c(
                  'flex',
                  'flex-col',
                  'w-full',
                  tc.isSplit && 'border border-white/20 border-dashed rounded-xl',
                ),
              },
              ...tc.tabs.map((t) => renderTab(winId, t)),
            ),
          ),
          ...(childrenCount === 0
            ? []
            : [
                h(
                  'div',
                  {
                    class: 'relative group/collapse mb-1',
                  },
                  h('div', {
                    class: c(
                      'absolute',
                      'top-0',
                      '-bottom-1',
                      'right-0',
                      'border-l-2',
                      'border-b-2',
                      'rounded-bl-xl',
                      'border-white/30',
                      'transition-all',
                      'cursor-pointer',
                      'hover:border-white',
                      'hover:border-l-4',
                      'hover:border-b-4',
                      'before:absolute',
                      'before:inset-0',
                      'before:border-l-2',
                      'before:border-b-2',
                      'before:border-transparent',
                      'before:pointer-events-auto',
                      'left-4.5',
                      'group-[.collapsed]/sidebar:hidden',
                      tc.collapseChildren && 'hidden',
                    ),
                    onclick: () => {
                      abCommands.perform(winId, 'toggle-collapse-children', {
                        tabContainerId: tc.id,
                      });
                    },
                  }), //frame
                  ...tc.children.map((tcc) =>
                    h(
                      'div',
                      {
                        key: tcc.id,
                        'data-tab-container-id': String(tcc.id),
                        class: c(
                          'group-[.collapsed]/sidebar:ml-1',
                          'ml-6',
                          'relative',
                          'z-10',
                          tc.collapseChildren && 'hidden',
                          tcc.isSplit && 'border border-white/20 border-dashed rounded-xl',
                        ),
                      },
                      ...tcc.tabs.map((tcct) => renderTab(winId, tcct)),
                    ),
                  ),
                ),
              ]),
          ...(tc.collapseChildren
            ? [
                h(
                  'div',
                  {
                    class: c(
                      childrenCount === 0 ? 'hidden' : 'group-[.collapsed]/sidebar:hidden block',
                      'text-xs',
                      '-mt-1.5',
                      'ml-10',
                      'text-white',
                      'opacity-40',
                      'cursor-pointer',
                      'hover:opacity-100',
                      'transition-opacity',
                      'duration-200',
                    ),
                    onclick: () => {
                      abCommands.perform(winId, 'toggle-collapse-children', {
                        tabContainerId: tc.id,
                      });
                    },
                  },
                  collapsedText,
                ),
              ]
            : []),
        );
      }),
    ),
    {
      onUpdated: () => {
        const selectedTab = tabContainers
          .flatMap((tc) => [...tc.tabs, ...tc.children.flatMap((tcc) => tcc.tabs)])
          .find((tab) => tab.selected);

        if (!selectedTab) {
          return;
        }

        document
          .getElementById('sidebar-tabs')
          ?.querySelector<HTMLElement>(`[data-tab-id="${selectedTab.id}"]`)
          ?.scrollIntoView({ block: 'nearest' });
      },
    },
  );
}

function renderTab(winId: TWindowId, t: ITab): VNode {
  const hit = tabMemo.get(t);
  if (hit) return hit;
  const v = buildTabVNode(winId, t);
  tabMemo.set(t, v);
  return v;
}

function buildTabVNode(winId: TWindowId, t: ITab): VNode {
  let tooltip = `<b>${t.title}</b>`;
  if (t.url) {
    try {
      const parsed = new URL(t.url);
      tooltip += `<span>${parsed.hostname}</span>`;
    } catch {
      // Nothing
    }
  }

  return h(
    'div', // Tab
    {
      'data-tab-id': String(t.id),
      'data-open-tabs-as-child': t.openTabsAsChild ? 'true' : 'false',
      key: t.id,
      class: c(
        'py-1',
        'my-px',
        'cursor-pointer',
        'gap-1',
        'items-start',
        'grid',
        'group-[.collapsed]/sidebar:grid-cols-1',
        'grid-cols-[24px_auto_25px]',
        'relative',
        'rounded-lg',
        !t.selected && 'hover:bg-white/10',
        t.suspended ? 'group/suspended opacity-50' : 'group/active',
        t.isClosed && 'hidden',
      ),
      onclick: selectTabFromEvent.bind(null, winId),
      oncontextmenu: openTabMenuFromEvent.bind(null, winId),
      draggable: 'true',
      ondragstart: tabDragStart,
      ondragover: tabDragOver,
      ondragleave: tabDragLeave,
      ondrop: tabDrop,
      ondragend: tabDragEnd,
    },
    h('div', {
      class: c(
        'absolute',
        'inset-0',
        'bg-white/20',
        'transition-opacity',
        'duration-200',
        'pointer-events-none',
        'z-0',
        'rounded-lg',
        t.selected ? 'opacity-100' : 'opacity-0',
      ),
    }),
    h(
      'span', // Loading spinner
      {
        class: c(
          'relative',
          'z-10',
          'loading',
          'loading-spinner',
          'loading-xs',
          'group-[.collapsed]/sidebar:ml-auto',
          'group-[.collapsed]/sidebar:mr-auto',
          'ml-1',
          'mr-0',
          'mt-0.5',
          t.loading ? 'block' : 'hidden',
        ),
      },
      '',
    ),
    h(
      'img', // Favicon
      {
        src: t.favicon || Favicon.src,
        onerror: `this.onerror=null;this.src="${Favicon.src}";`,
        class: c(
          'relative',
          'z-10',
          'w-[16px]',
          'h-[16px]',
          'group-[.collapsed]/sidebar:w-5.5',
          'group-[.collapsed]/sidebar:h-5.5',
          'mt-0.5',
          'ml-1',
          'mr-0',
          'group-[.collapsed]/sidebar:ml-auto',
          'group-[.collapsed]/sidebar:mr-auto',
          'group-[.collapsed]/sidebar:mt-0',
          'text-white',
          t.loading ? 'hidden' : 'block',
        ),
        'data-tooltip': tooltip,
        'data-tooltip-position': 'sidebar-end',
      },
      '',
    ),
    h(
      'div', // Title + indicators container
      {
        class: 'relative z-10 group-[.collapsed]/sidebar:hidden flex flex-col min-w-0',
      },
      h(
        'span', // Title
        {
          class: 'text-sm overflow-hidden text-ellipsis text-nowrap',
          'data-tooltip': tooltip,
          'data-tooltip-position': 'sidebar-end',
        },
        t.title,
      ),
      h(
        'div', // Indicators container
        { class: 'flex gap-1 mt-0' },
        highlightIcon(TabPreview, t.hasTabPreview, 'text-white'),
        highlightIcon(Muted, t.isMuted, 'text-white'),
        highlightIcon(Warning, t.requireAttention, 'text-red-500'),
      ),
      ...(t.tags.length > 0
        ? [
            h(
              'div', // Tags container
              { class: 'flex gap-1 items-center overflow-hidden mt-1' },
              ...t.tags.map((tag) =>
                h(
                  'span', // Tag chip
                  {
                    class: 'text-xs px-1.5 py-0.5 rounded-full leading-none truncate',
                    style: { backgroundColor: tag.color, color: tag.textColor },
                  },
                  tag.name,
                ),
              ),
            ),
          ]
        : []),
    ),
    h(
      'div', // Partition and actions container
      { class: 'relative h-full z-10 group-[.collapsed]/sidebar:hidden flex justify-end' },
      h(
        'div', // Partition/Profile color
        {
          class:
            'relative -top-0 bottom-0 right-1.5 rounded w-1 group-hover/suspended:hidden group-hover/active:hidden',
          style: { backgroundColor: t.partition.color },
        },
      ),
      btnIcon(Close, {
        classNames: ['text-white', 'hidden', 'group-hover/suspended:block'],
        size: 5,
        dataAction: 'close-tab',
        onClick: closeTabFromEvent.bind(null, winId),
      }),
      btnIcon(Minus, {
        classNames: ['text-white', 'hidden', 'group-hover/active:block'],
        size: 5,
        dataAction: 'suspend-tab',
        onClick: suspendTabFromEvent.bind(null, winId),
      }),
    ),
  );
}

function selectTabFromEvent(winId: TWindowId, e: Event) {
  const tabId = tabIdFromEvent(e);
  if (tabId !== null) {
    abCommands.perform(winId, 'select-tab', { tabId });
  }
}

function openTabMenuFromEvent(winId: TWindowId, e: Event) {
  const tabId = tabIdFromEvent(e);
  if (tabId !== null) {
    abMenu.contextMenu(winId, 'tab', { tabId });
  }
}

function closeTabFromEvent(winId: TWindowId, e: Event) {
  e.stopPropagation();
  const tabId = tabIdFromEvent(e);
  if (tabId !== null) {
    abCommands.perform(winId, 'close-tab', { tabId });
  }
}

function suspendTabFromEvent(winId: TWindowId, e: Event) {
  e.stopPropagation();
  const tabId = tabIdFromEvent(e);
  if (tabId !== null) {
    abCommands.perform(winId, 'suspend-tab', { tabId });
  }
}

function tabIdFromEvent(e: Event): number | null {
  const row = (e.currentTarget as HTMLElement | null)?.closest(
    '[data-tab-id]',
  ) as HTMLElement | null;
  const raw = row?.dataset.tabId;
  return raw === undefined ? null : Number(raw);
}

function highlightIcon(icon: string, visible: boolean, color: string): VNode {
  return h(
    'div',
    {
      class: c(
        'w-3.5',
        'h-3.5',
        visible ? 'block' : 'hidden',
        color,
        '[&>svg]:w-full',
        '[&>svg]:h-full',
      ),
      innerHTML: icon,
    },
    '',
  );
}

export function openEmojiPicker(winId: TWindowId, tabId: number) {
  const row = document.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement | null;
  if (!row) {
    return;
  }

  const bounds = row.getBoundingClientRect();

  abModal.openContextual(winId, 'contextual-tab-emoji', {
    bounds: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    },
    anchor: 'right',
    query: {
      tabId: tabId.toString(),
    },
  });
}

export function updateTabInContainers(
  containers: ITabContainer[],
  tab: ITab,
): ITabContainer[] | null {
  let found = false;

  const result = containers.map((tc) => {
    const tabIndex = tc.tabs.findIndex((t) => t.id === tab.id);
    if (tabIndex !== -1) {
      found = true;
      const tabs = [...tc.tabs];
      tabs[tabIndex] = tab;
      return { ...tc, tabs };
    }

    let childFound = false;
    const children = tc.children.map((tcc) => {
      const childTabIndex = tcc.tabs.findIndex((t) => t.id === tab.id);
      if (childTabIndex !== -1) {
        childFound = true;
        found = true;
        const tabs = [...tcc.tabs];
        tabs[childTabIndex] = tab;
        return { ...tcc, tabs };
      }
      return tcc;
    });

    return childFound ? { ...tc, children } : tc;
  });

  return found ? result : null;
}
