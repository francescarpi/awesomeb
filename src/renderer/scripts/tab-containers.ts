import { ITab, ITabContainer, TTabId, TWindowId } from '~/types';

const suspendBtnTpl = document.getElementById('suspend-button-template') as HTMLTemplateElement;
const closeBtnTpl = document.getElementById('close-button-template') as HTMLTemplateElement;

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

class TabContainer extends HTMLLIElement {
  private _numberElement: HTMLSpanElement | null = null;

  init(tabContainer: ITabContainer) {
    this.id = `tab-container-${tabContainer.id}`;
    this.classList.add('flex', 'items-center', 'gap-1');

    const numberElement = document.createElement('span');
    numberElement.textContent = '0';
    numberElement.classList.add('text-xs', 'pl-1', 'text-white/20', 'hidden', 'sidebar:block');
    this._numberElement = numberElement;

    const tabsContainerElement = document.createElement('ul');
    tabsContainerElement.classList.add('w-full');

    this.appendChild(numberElement);
    this.appendChild(tabsContainerElement);
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
      'cursor-pointer',
      'hover:bg-white/10',
      'gap-1',
      'items-center',
      'rounded-tl-full',
      'rounded-bl-full',
      'grid',
      'grid-cols-1',
      'sidebar:grid-cols-[24px_auto_25px]',
      'group',
      'select-none',
    );

    // Favicon and loading spinner container
    const faviconContainer = document.createElement('div');
    faviconContainer.classList.add(
      'justify-center',
      'items-center',
      'sidebar:ml-2',
      'flex',
      'py-2',
      'sidebar:py-0',
      'favicon-container',
    );

    this._loadingElement = document.createElement('span');
    this._loadingElement.classList.add('loading', 'loading-spinner', 'loading-xs', 'hidden');

    if (favicon) {
      this._faviconElement = favicon;
    } else {
      this._faviconElement = document.createElement('img');
      this._faviconElement.classList.add('favicon', 'w-4', 'h-4');
      this._faviconElement.dataset.tabId = tab.id.toString();
    }

    this.loadFavicon(winId);

    this._faviconElement.onclick = () => abCommands.perform(winId, 'select-tab', { tabId: tab.id });
    this._faviconElement.oncontextmenu = () => abMenu.contextMenu(winId, 'tab', { tabId: tab.id });

    faviconContainer.appendChild(this._loadingElement);
    faviconContainer.appendChild(this._faviconElement);

    // Title element
    const titleContainer = document.createElement('div');
    titleContainer.classList.add(
      'py-2',
      'hidden',
      'sidebar:block',
      'flex',
      'flex-col',
      'overflow-hidden',
      'text-ellipsis',
      'text-sm',
      'text-nowrap',
    );

    const titleElement = document.createElement('span');
    titleContainer.appendChild(titleElement);

    titleContainer.onclick = () => abCommands.perform(winId, 'select-tab', { tabId: tab.id });
    titleContainer.oncontextmenu = () => abMenu.contextMenu(winId, 'tab', { tabId: tab.id });
    titleContainer.ondblclick = () => abModal.open(winId, 'rename-tab');

    this._titleElement = titleElement;
    this.setTitle(tab.title);

    // Highlights
    const highlightsContainer = document.createElement('div');
    highlightsContainer.classList.add('flex', 'gap-1');

    const tabPreviewHighlight = document.createElement('span');
    tabPreviewHighlight.textContent = 'P';
    tabPreviewHighlight.classList.add('hasTabPreview', 'hidden');
    this.setHighlight({ hasTabPreview: tab.hasTabPreview });

    highlightsContainer.appendChild(tabPreviewHighlight);

    titleContainer.appendChild(highlightsContainer);

    // Partition and action buttons container
    const partitionAndActionsContainer = document.createElement('div');
    partitionAndActionsContainer.classList.add('hidden', 'sidebar:flex', 'justify-end', 'mr-1');

    const partitionIndicator = document.createElement('span');
    partitionIndicator.classList.add('w-1', 'h-5', 'group-hover:hidden');
    partitionIndicator.style.backgroundColor = tab.partition.color;

    const suspendBtn = (suspendBtnTpl.content.cloneNode(true) as DocumentFragment).querySelector(
      'svg',
    ) as SVGSVGElement;
    suspendBtn.onclick = () => abCommands.perform(winId, 'suspend-tab', { tabId: tab.id });

    const closeBtn = (closeBtnTpl.content.cloneNode(true) as DocumentFragment).querySelector(
      'svg',
    ) as SVGSVGElement;
    closeBtn.onclick = () => abCommands.perform(winId, 'close-tab', { tabId: tab.id });

    partitionAndActionsContainer.appendChild(partitionIndicator);
    partitionAndActionsContainer.appendChild(suspendBtn);
    partitionAndActionsContainer.appendChild(closeBtn);

    this.appendChild(faviconContainer);
    this.appendChild(titleContainer);
    this.appendChild(partitionAndActionsContainer);
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
      this.classList.add('suspended', 'opacity-50');
      this.classList.remove('active');
    } else {
      this.classList.remove('suspended', 'opacity-50');
      this.classList.add('active');
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
