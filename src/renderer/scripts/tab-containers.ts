import { ITab, ITabContainer, TTabId, TWindowId } from '~/types';
import TabPreview from '#/icons/tab-preview.svg';
import Minus from '#/icons/minus.svg';
import Close from '#/icons/close.svg';

/***************************************************************************************************************
 * MANAGER
 ***************************************************************************************************************/
export class TabContainersMng {
  private readonly _container: HTMLUListElement;

  constructor() {
    const container = document.getElementById('tabContainers') as HTMLUListElement;
    this._container = container;
  }

  renderTabContainers(winId: TWindowId, tabContainers: ITabContainer[]) {
    // To prevent flickering of favicons, we store them in a temporary object and reuse the same image elements when possible
    const favicons: Record<TTabId, HTMLImageElement> = {};
    const existingFavicons = this._container.querySelectorAll(
      'img.favicon',
    ) as unknown as HTMLImageElement[];
    for (const favicon of existingFavicons) {
      const tabId = parseInt(favicon.dataset.tabId as string, 10);
      if (tabId) {
        favicons[tabId] = favicon;
      }
    }

    this._container.innerHTML = '';

    for (const [idx, tabContainer] of tabContainers.entries()) {
      const tContainer = this.createTabContainer(tabContainer, idx, winId, favicons);
      this._container.insertBefore(tContainer, this._container.children[idx]);
    }
  }

  private createTabContainer(
    tabContainer: ITabContainer,
    idx: number,
    winId: TWindowId,
    faviconsMap: Record<TTabId, HTMLImageElement>,
  ): TabContainer {
    const tabContainerElement = document.createElement('li', {
      is: 'tab-container-el',
    }) as TabContainer;

    tabContainerElement.init(tabContainer);
    tabContainerElement.setNumber(idx + 1);
    tabContainerElement.setDivider(tabContainer.divider);

    for (const tab of tabContainer.tabs) {
      const tabElement = document.createElement('li', {
        is: 'tab-el',
      }) as Tab;
      tabElement.init(winId, tab, faviconsMap[tab.id] || null);
      tabContainerElement.addTabChild(tabElement);
    }

    return tabContainerElement;
  }

  refreshTab(winId: TWindowId, tab: ITab) {
    const tabElement = this._container.querySelector(`li#tab-${tab.id}`) as Tab | null;

    if (!tabElement) {
      console.warn(`Tab with id ${tab.id} not found for update`);
      return;
    }

    tabElement.showLoading(tab.loading);
    tabElement.loadFavicon(winId);
    tabElement.setTitle(tab.title);
    tabElement.setSuspended(tab.suspended);
    tabElement.setSelected(tab.selected);
    tabElement.setHighlight({ hasTabPreview: tab.hasTabPreview });
  }
}

/***************************************************************************************************************
 * TAB CONTAINER
 ***************************************************************************************************************/
class TabContainer extends HTMLLIElement {
  private _numberElement: HTMLSpanElement | null = null;

  init(tabContainer: ITabContainer) {
    this.id = `tab-container-${tabContainer.id}`;
    this.classList.add('flex', 'items-center', 'gap-1');

    const numberElement = this.createNumberElement(0);
    this.appendChild(numberElement);

    this.appendChild(this.createTabsContainerElement());
  }

  private createNumberElement(num: number): HTMLSpanElement {
    const numberElement = document.createElement('span');
    this._numberElement = numberElement;
    numberElement.textContent = num.toString();
    numberElement.classList.add('text-xs', 'pl-1', 'text-white/20', 'hidden', 'sidebar:block');
    return numberElement;
  }

  private createTabsContainerElement(): HTMLUListElement {
    const tabsContainerElement = document.createElement('ul');
    tabsContainerElement.classList.add('w-full');
    return tabsContainerElement;
  }

  setNumber(num: number) {
    if (this._numberElement) {
      this._numberElement.textContent = num.toString();
      if (num <= 8) {
        this._numberElement.classList.remove('hidden');
      } else {
        this._numberElement.classList.add('hidden');
      }
    }
  }

  addTabChild(tab: Tab) {
    const tabsContainer = this.querySelector('ul');

    if (tabsContainer) {
      tabsContainer.appendChild(tab);
    }
  }

  setDivider(visible: boolean) {
    if (visible) {
      this.classList.add('border-b', 'border-white/20', 'border-dashed', 'pb-1.5');
    } else {
      this.classList.remove('border-b', 'border-white/20', 'border-dashed', 'pb-1.5');
    }
  }
}

/***************************************************************************************************************
 * TAB
 ***************************************************************************************************************/
class Tab extends HTMLLIElement {
  private _tab: ITab | null = null;
  private _loadingElement: HTMLSpanElement | null = null;
  private _faviconElement: HTMLImageElement | null = null;
  private _titleElement: HTMLSpanElement | null = null;

  init(winId: TWindowId, tab: ITab, favicon: HTMLImageElement | null = null) {
    this._tab = tab;
    this.id = `tab-${tab.id}`;

    this.setSuspended(tab.suspended);
    this.setSelected(tab.selected);

    // Classes for the tab element
    this.classList.add(
      'py-1.5',
      'cursor-pointer',
      'hover:bg-white/10',
      'gap-1',
      'items-start',
      'rounded-tl-lg',
      'rounded-bl-lg',
      'sidebar:rounded-tl-full',
      'sidebar:rounded-bl-full',
      'grid',
      'grid-cols-1',
      'sidebar:grid-cols-[24px_auto_25px]',
      'select-none',
    );

    // Favicon and loading spinner container
    const faviconContainer = this.createFaviconContainerElement();
    const loadingElement = this.createLoadingElement();
    const { element: faviconElement, created: faviconCreated } = this.createFaviconElement(
      winId,
      tab.id,
      favicon,
    );
    faviconContainer.appendChild(loadingElement);
    faviconContainer.appendChild(faviconElement);

    // Title element
    const titleContainer = this.createTitleContainer(winId, tab.id);
    const titleElement = this.createTitleElement();

    // Highlights
    const highlights = this.createHighlightsElement();
    titleContainer.appendChild(titleElement);
    titleContainer.appendChild(highlights);

    // Partition and action buttons container
    const partitionAndActionsContainer = this.createPartitionAndButtonsElement();
    const partitionIndicator = this.createPartitionElement(tab.partition.color);

    const suspendBtn = this.createButton(Minus.src, 'group-hover/active:block', () =>
      abCommands.perform(winId, 'suspend-tab', { tabId: tab.id }),
    );
    const closeBtn = this.createButton(Close.src, 'group-hover/suspended:block', () =>
      abCommands.perform(winId, 'close-tab', { tabId: tab.id }),
    );

    partitionAndActionsContainer.appendChild(partitionIndicator);
    partitionAndActionsContainer.appendChild(suspendBtn);
    partitionAndActionsContainer.appendChild(closeBtn);

    this.appendChild(faviconContainer);
    this.appendChild(titleContainer);
    this.appendChild(partitionAndActionsContainer);

    this.setHighlight({ hasTabPreview: tab.hasTabPreview });
    this.setTitle(tab.title);
    if (faviconCreated) {
      this.loadFavicon(winId);
    }
  }

  private createButton(svgPath: string, groupHover: string, onClick: () => void): HTMLImageElement {
    const button = document.createElement('img');
    button.classList.add(
      'hover:bg-white/30',
      'w-5',
      'h-5',
      'rounded',
      'cursor-pointer',
      'hidden',
      groupHover,
    );

    button.src = svgPath;
    button.onclick = onClick;

    return button;
  }

  private createPartitionElement(color: string): HTMLSpanElement {
    const partitionIndicator = document.createElement('span');
    partitionIndicator.classList.add(
      'w-1',
      'h-5',
      'group-hover/active:hidden',
      'group-hover/suspended:hidden',
    );
    partitionIndicator.style.backgroundColor = color;
    return partitionIndicator;
  }

  private createHighlightsElement(): HTMLDivElement {
    const highlightsContainer = document.createElement('div');
    highlightsContainer.classList.add('flex', 'gap-1');

    const tabPreviewHighlight = document.createElement('img');
    tabPreviewHighlight.src = TabPreview.src;
    tabPreviewHighlight.classList.add('hasTabPreview', 'w-3', 'h-3', 'hidden');

    highlightsContainer.appendChild(tabPreviewHighlight);

    return highlightsContainer;
  }

  private createPartitionAndButtonsElement(): HTMLDivElement {
    const partitionAndActionsContainer = document.createElement('div');
    partitionAndActionsContainer.classList.add('hidden', 'sidebar:flex', 'justify-end', 'mr-1');
    return partitionAndActionsContainer;
  }

  private createTitleContainer(winId: TWindowId, tabId: TTabId): HTMLDivElement {
    const titleContainer = document.createElement('div');
    titleContainer.classList.add(
      'hidden',
      'sidebar:block',
      'flex',
      'flex-col',
      'overflow-hidden',
      'text-ellipsis',
      'text-sm',
      'text-nowrap',
    );
    titleContainer.onclick = () => abCommands.perform(winId, 'select-tab', { tabId });
    titleContainer.oncontextmenu = () => abMenu.contextMenu(winId, 'tab', { tabId });
    titleContainer.ondblclick = () => abModal.open(winId, 'rename-tab');
    return titleContainer;
  }

  private createTitleElement(): HTMLSpanElement {
    const titleElement = document.createElement('span');
    this._titleElement = titleElement;
    return titleElement;
  }

  private createFaviconContainerElement(): HTMLDivElement {
    const faviconContainer = document.createElement('div');
    faviconContainer.classList.add(
      'justify-center',
      'items-center',
      'sidebar:ml-2',
      'flex',
      'mt-0.4',
      'sidebar:mt-0.5',
      'sidebar:py-0',
      'favicon-container',
    );
    return faviconContainer;
  }

  private createLoadingElement(): HTMLSpanElement {
    this._loadingElement = document.createElement('span');
    this._loadingElement.classList.add('loading', 'loading-spinner', 'loading-xs', 'hidden');
    return this._loadingElement;
  }

  private createFaviconElement(
    winId: TWindowId,
    tabId: TTabId,
    existingFavicon: HTMLImageElement | null,
  ): { element: HTMLImageElement; created: boolean } {
    let created;
    if (existingFavicon) {
      this._faviconElement = existingFavicon;
      created = false;
    } else {
      this._faviconElement = document.createElement('img');
      this._faviconElement.classList.add('favicon', 'w-4', 'h-4');
      this._faviconElement.dataset.tabId = tabId.toString();
      created = true;
    }

    this._faviconElement.onclick = () => abCommands.perform(winId, 'select-tab', { tabId });
    this._faviconElement.oncontextmenu = () => abMenu.contextMenu(winId, 'tab', { tabId });

    return { element: this._faviconElement, created };
  }

  showLoading(visible: boolean) {
    if (this._loadingElement && this._faviconElement) {
      if (visible) {
        this._loadingElement.classList.remove('hidden');
        this._faviconElement.classList.add('hidden');
      } else {
        this._loadingElement.classList.add('hidden');
        this._faviconElement.classList.remove('hidden');
      }
    }
  }

  async loadFavicon(winId: TWindowId) {
    if (this._tab && this._faviconElement) {
      const favicon = await abFavicons.get(winId, this._tab.id);
      if (favicon) {
        this._faviconElement.src = favicon;
      }
    }
  }

  setTitle(title: string) {
    if (this._titleElement) {
      this._titleElement.textContent = title;
    }
  }

  setSuspended(suspended: boolean) {
    if (suspended) {
      this.classList.add('group/suspended', 'opacity-50');
      this.classList.remove('group/active');
    } else {
      this.classList.remove('group/suspended', 'opacity-50');
      this.classList.add('group/active');
    }
  }

  setSelected(selected: boolean) {
    if (selected) {
      this.classList.add('bg-white/20');
    } else {
      this.classList.remove('bg-white/20');
    }
  }

  setHighlight({ hasTabPreview }: { hasTabPreview: boolean }) {
    const tabPreviewHighlight = this.querySelector('.hasTabPreview') as HTMLSpanElement | null;

    if (tabPreviewHighlight) {
      if (hasTabPreview) {
        tabPreviewHighlight.classList.remove('hidden');
      } else {
        tabPreviewHighlight.classList.add('hidden');
      }
    }
  }
}

customElements.define('tab-container-el', TabContainer, { extends: 'li' });
customElements.define('tab-el', Tab, { extends: 'li' });
