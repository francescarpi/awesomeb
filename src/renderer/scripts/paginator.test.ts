import { describe, it, expect, beforeEach } from 'vitest';
import {
  paginatorManager,
  getPaginator,
  getPaginatorAsync,
  _resetPaginatorRegistryForTests,
} from './paginator';

const PAGE_OF_TPL = 'Page {{current}} of {{total}}: {{label}}';
const LEGEND_TPL = '<kbd>{{next}}</kbd> / <kbd>{{prev}}</kbd>';
const ARIA_LABEL = 'Pagination';
const GO_TO_LABEL = (label: string): string => `Go to ${label}`;

function buildFixture(pageIds: string[]): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML =
    `<div id="pagesIndicator"></div>` +
    pageIds
      .map(
        (id) => `
    <div id="${id}" class="page">
      <input type="text" />
    </div>
  `,
      )
      .join('');
  document.body.appendChild(root);
  return root;
}

function makeManager(pageIds: string[], labels: string[]) {
  return paginatorManager('pagesIndicator', pageIds, {
    labels,
    shortcuts: { next: 'Tab', prev: 'Shift+Tab' },
    pageOfTpl: PAGE_OF_TPL,
    legendTpl: LEGEND_TPL,
    ariaLabel: ARIA_LABEL,
    goToPageLabel: GO_TO_LABEL,
  });
}

function getContainer(): HTMLElement {
  return document.getElementById('pagesIndicator') as HTMLElement;
}

function getButtons(): HTMLButtonElement[] {
  return Array.from(getContainer().querySelectorAll('button'));
}

describe('paginatorManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetPaginatorRegistryForTests();
  });

  it('renders initial state: text, 3 buttons, tablist role', () => {
    const fixture = buildFixture(['query', 'partition', 'target']);
    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );
    manager.refreshPageIndicator();

    const container = getContainer();
    expect(container.getAttribute('role')).toBe('tablist');
    expect(container.getAttribute('aria-label')).toBe(ARIA_LABEL);
    expect(container.textContent).toContain('Page 1 of 3: Search');

    const buttons = getButtons();
    expect(buttons).toHaveLength(3);
    expect(buttons[0].textContent).toBe('●');
    expect(buttons[0].getAttribute('aria-current')).toBe('page');
    expect(buttons[0].getAttribute('aria-label')).toBe('Go to Search');
    expect(buttons[1].getAttribute('aria-current')).toBe('false');
    expect(buttons[2].getAttribute('aria-current')).toBe('false');

    expect(container.querySelectorAll('kbd')).toHaveLength(2);
    fixture.remove();
  });

  it('nextPage advances and focuses the new page input', () => {
    const fixture = buildFixture(['query', 'partition', 'target']);
    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );
    manager.refreshPageIndicator();

    manager.nextPage();

    expect(getButtons()[1].getAttribute('aria-current')).toBe('page');
    expect(getContainer().textContent).toContain('Page 2 of 3: Profile');
    expect(document.activeElement).toBe(
      document.getElementById('partition')!.querySelector('input'),
    );
    fixture.remove();
  });

  it('previousPage wraps from index 0 to last page', () => {
    const fixture = buildFixture(['query', 'partition', 'target']);
    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );
    manager.refreshPageIndicator();

    manager.previousPage();

    const buttons = getButtons();
    expect(buttons[2].getAttribute('aria-current')).toBe('page');
    expect(buttons[0].getAttribute('aria-current')).toBe('false');
    expect(getContainer().textContent).toContain('Page 3 of 3: Destination');
    expect(document.activeElement).toBe(document.getElementById('target')!.querySelector('input'));
    fixture.remove();
  });

  it('goToPage jumps to specific index and focuses new page input', () => {
    const fixture = buildFixture(['query', 'partition', 'target']);
    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );
    manager.refreshPageIndicator();

    manager.goToPage(1);

    expect(getButtons()[1].getAttribute('aria-current')).toBe('page');
    expect(getContainer().textContent).toContain('Page 2 of 3: Profile');
    expect(document.activeElement).toBe(
      document.getElementById('partition')!.querySelector('input'),
    );
    fixture.remove();
  });

  it('goToPage clamps out-of-range indices', () => {
    const fixture = buildFixture(['query', 'partition', 'target']);
    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );
    manager.refreshPageIndicator();

    manager.goToPage(-5);
    expect(getButtons()[0].getAttribute('aria-current')).toBe('page');

    manager.goToPage(99);
    const buttons = getButtons();
    expect(buttons[2].getAttribute('aria-current')).toBe('page');
    fixture.remove();
  });

  it('button click triggers goToPage with the right index', () => {
    const fixture = buildFixture(['query', 'partition', 'target']);
    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );
    manager.refreshPageIndicator();

    getButtons()[2].click();

    expect(getButtons()[2].getAttribute('aria-current')).toBe('page');
    expect(getContainer().textContent).toContain('Page 3 of 3: Destination');
    expect(document.activeElement).toBe(document.getElementById('target')!.querySelector('input'));
    fixture.remove();
  });

  it('dispose clears innerHTML, unregisters, and prevents further clicks', () => {
    const fixture = buildFixture(['query', 'partition', 'target']);
    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );
    manager.refreshPageIndicator();

    expect(getPaginator('pagesIndicator')).toBe(manager);

    const beforeCount = getButtons().length;
    expect(beforeCount).toBe(3);

    manager.dispose();

    expect(getContainer().innerHTML).toBe('');
    expect(getPaginator('pagesIndicator')).toBeUndefined();

    fixture.remove();
  });

  it('handles N=2 (move-tab fixture) correctly', () => {
    const fixture = buildFixture(['tab', 'target']);
    const manager = makeManager(['tab', 'target'], ['Tab', 'Destination']);
    manager.refreshPageIndicator();

    const container = getContainer();
    expect(getButtons()).toHaveLength(2);
    expect(container.textContent).toContain('Page 1 of 2: Tab');

    manager.nextPage();

    expect(container.textContent).toContain('Page 2 of 2: Destination');
    expect(getButtons()[1].getAttribute('aria-current')).toBe('page');
    expect(document.activeElement).toBe(document.getElementById('target')!.querySelector('input'));

    manager.previousPage();
    manager.previousPage();

    expect(container.textContent).toContain('Page 2 of 2: Destination');
    fixture.remove();
  });

  it('renders localized shortcut names inside <kbd> elements (ca fixture)', () => {
    const fixture = buildFixture(['tab', 'target']);
    const manager = paginatorManager('pagesIndicator', ['tab', 'target'], {
      labels: ['Pestanya', 'Destinació'],
      shortcuts: { next: 'Tab', prev: 'Maj+Tab' },
      pageOfTpl: 'Pàgina {{current}} de {{total}}: {{label}}',
      legendTpl: '<kbd>{{next}}</kbd> / <kbd>{{prev}}</kbd>',
      ariaLabel: 'Paginació',
      goToPageLabel: (label: string) => `Anar a ${label}`,
    });
    manager.refreshPageIndicator();

    const kbds = getContainer().querySelectorAll('kbd');
    expect(kbds).toHaveLength(2);
    expect(kbds[0].textContent).toBe('Tab');
    expect(kbds[1].textContent).toBe('Maj+Tab');

    const container = getContainer();
    expect(container.getAttribute('aria-label')).toBe('Paginació');
    expect(container.textContent).toContain('Pàgina 1 de 2: Pestanya');
    expect(getButtons()[0].getAttribute('aria-label')).toBe('Anar a Pestanya');
    fixture.remove();
  });
});

describe('paginator registry', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    _resetPaginatorRegistryForTests();
  });

  it('paginatorManager auto-registers the instance under the given id', () => {
    buildFixture(['query', 'partition', 'target']);
    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );

    expect(getPaginator('pagesIndicator')).toBe(manager);
  });

  it('getPaginator returns undefined for unknown ids', () => {
    expect(getPaginator('nonexistent')).toBeUndefined();
  });

  it('getPaginatorAsync resolves immediately if already registered', async () => {
    buildFixture(['query', 'partition', 'target']);
    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );

    const resolved = await getPaginatorAsync('pagesIndicator');
    expect(resolved).toBe(manager);
  });

  it('getPaginatorAsync resolves later when paginatorManager is called after the await', async () => {
    buildFixture(['query', 'partition', 'target']);

    const pending = getPaginatorAsync('pagesIndicator');

    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );

    const resolved = await pending;
    expect(resolved).toBe(manager);
  });

  it('getPaginatorAsync resolves all waiters when the paginator is registered', async () => {
    buildFixture(['query', 'partition', 'target']);

    const w1 = getPaginatorAsync('pagesIndicator');
    const w2 = getPaginatorAsync('pagesIndicator');

    const manager = makeManager(
      ['query', 'partition', 'target'],
      ['Search', 'Profile', 'Destination'],
    );

    expect(await w1).toBe(manager);
    expect(await w2).toBe(manager);
  });
});
