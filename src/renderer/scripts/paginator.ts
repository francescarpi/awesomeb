interface PaginatorOptions {
  /** Semantic label per page, same order as `pagesIds`. Pre-resolved by the caller via `abI18n.t`. */
  labels: string[];
  /** Shortcut names to display in the legend. Pre-resolved. */
  shortcuts: { next: string; prev: string };
  /** Pre-translated "Page X of Y" template. Must contain `{{current}}`, `{{total}}`, and `{{label}}`. */
  pageOfTpl: string;
  /** Pre-translated legend template. May contain `<kbd>` HTML (i18next keeps it raw). */
  legendTpl: string;
  /** Pre-translated aria-label for the tablist container. */
  ariaLabel: string;
  /** Builds the per-button aria-label (e.g. "Go to Search"). */
  goToPageLabel: (label: string) => string;
}

export type PaginatorInstance = {
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (i: number) => void;
  refreshPageVisibility: () => void;
  refreshPageIndicator: () => void;
  dispose: () => void;
};

const registry = new Map<string, PaginatorInstance>();
const waiters = new Map<string, Array<(instance: PaginatorInstance) => void>>();

function notify(id: string, instance: PaginatorInstance): void {
  registry.set(id, instance);
  const pending = waiters.get(id);
  if (pending) {
    for (const resolve of pending) resolve(instance);
    waiters.delete(id);
  }
}

export function getPaginator(id: string): PaginatorInstance | undefined {
  return registry.get(id);
}

export function getPaginatorAsync(id: string): Promise<PaginatorInstance> {
  const existing = registry.get(id);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const pending = waiters.get(id) ?? [];
    pending.push(resolve);
    waiters.set(id, pending);
  });
}

export function _resetPaginatorRegistryForTests(): void {
  registry.clear();
  waiters.clear();
}

export function paginatorManager(
  pageIndicatorId: string,
  pagesIds: string[],
  options: PaginatorOptions,
): PaginatorInstance {
  const pageIndicatorEl = document.getElementById(pageIndicatorId)!;
  const pagesEls = pagesIds.map((id) => document.getElementById(id)!);

  let currentPageIndex = 0;
  let disposed = false;

  const refreshPageVisibility = () => {
    for (const page of pagesEls) {
      if (page === pagesEls[currentPageIndex]) {
        page.style.display = 'grid';
        page.querySelector('input')!.focus();
      } else {
        page.style.display = 'none';
      }
    }
  };

  const refreshPageIndicator = () => {
    pageIndicatorEl.innerHTML = '';
    pageIndicatorEl.setAttribute('role', 'tablist');
    pageIndicatorEl.setAttribute('aria-label', options.ariaLabel);

    const text = options.pageOfTpl
      .replace('{{current}}', String(currentPageIndex + 1))
      .replace('{{total}}', String(pagesEls.length))
      .replace('{{label}}', options.labels[currentPageIndex] ?? '');
    const textEl = document.createElement('span');
    textEl.className = 'select-none';
    textEl.textContent = text;
    pageIndicatorEl.appendChild(textEl);

    const buttonsRow = document.createElement('div');
    buttonsRow.className = 'flex items-center gap-1';

    options.labels.forEach((label, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'select-none cursor-pointer';
      button.textContent = i === currentPageIndex ? '●' : '○';
      button.setAttribute('aria-current', i === currentPageIndex ? 'page' : 'false');
      button.setAttribute('aria-label', options.goToPageLabel(label));
      button.addEventListener('click', () => {
        if (disposed) return;
        goToPage(i);
      });
      buttonsRow.appendChild(button);
    });

    const separator = document.createElement('span');
    separator.className = 'select-none opacity-50';
    separator.textContent = '|';
    buttonsRow.appendChild(separator);

    const legendEl = document.createElement('span');
    legendEl.className = 'select-none';
    legendEl.innerHTML = options.legendTpl
      .replace('{{next}}', options.shortcuts.next)
      .replace('{{prev}}', options.shortcuts.prev);
    buttonsRow.appendChild(legendEl);

    pageIndicatorEl.appendChild(buttonsRow);
  };

  const nextPage = () => {
    currentPageIndex = (currentPageIndex + 1) % pagesEls.length;
    refreshPageVisibility();
    refreshPageIndicator();
  };

  const previousPage = () => {
    currentPageIndex = (currentPageIndex - 1 + pagesEls.length) % pagesEls.length;
    refreshPageVisibility();
    refreshPageIndicator();
  };

  const goToPage = (i: number) => {
    if (i < 0) {
      currentPageIndex = 0;
    } else if (i >= pagesEls.length) {
      currentPageIndex = pagesEls.length - 1;
    } else {
      currentPageIndex = i;
    }
    refreshPageVisibility();
    refreshPageIndicator();
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    pageIndicatorEl.innerHTML = '';
    registry.delete(pageIndicatorId);
  };

  const instance: PaginatorInstance = {
    nextPage,
    previousPage,
    goToPage,
    refreshPageVisibility,
    refreshPageIndicator,
    dispose,
  };

  notify(pageIndicatorId, instance);

  return instance;
}
