import { Partition, history, Browser } from '@/core';
import { ITabProps } from './types';
import { TTabId } from '~/types';
import log from 'electron-log';
import { registerTabEvents } from './events';
import { sanitizeUserAgent } from '@/utils';
import { TabView } from './tab.view';
import { FindInPage } from './find-in-page';

const scopeLog = log.scope('Tab');

export class Tab {
  private readonly _partition: Partition;
  private _title: string | null = null;
  private _customTitle: string | null = null;
  private _url: string | null = null;
  private _suspended: boolean = true;
  private _loading: boolean = false;
  private _favicon: string | null = null;
  readonly view: TabView;
  private _lastAccessed: number = Date.now();
  private _findInPage: FindInPage | null = null;
  private _requireAttention: boolean = false;

  constructor(
    public readonly browser: Browser,
    public readonly id: TTabId,
    props: ITabProps,
  ) {
    this._partition = props.partition;
    this._title = props.title ?? null;
    this._customTitle = props.customTitle ?? null;
    this._url = props.url ?? null;
    this._suspended = props.suspended ?? true;

    // The view is not visible initially until method to refresh visible tabs is called.
    this.view = new TabView(id, this._partition.id);
    this.view.webContents.loadURL('about:blank');

    registerTabEvents(browser, this);
  }

  get partition(): Partition {
    return this._partition;
  }

  get title(): string {
    return this._customTitle || this._title || this._url || 'Untitled';
  }

  setTitle(title: string): boolean {
    if (this._title === title) {
      return false;
    }

    this._title = title;
    this.browser.eventsChannel.emit('tab:title-did-change', this);

    return true;
  }

  get url(): string | null {
    return this._url;
  }

  setUrl(url: string) {
    if (this._url === url) {
      return;
    }

    this._url = url;
    this.browser.eventsChannel.emit('tab:url-did-change', this);
  }

  get suspended(): boolean {
    return this._suspended;
  }

  get loading(): boolean {
    return this._loading;
  }

  setLoading(loading: boolean) {
    if (this._loading === loading) {
      return;
    }

    this._loading = loading;
    this.browser.eventsChannel.emit('tab:loading-did-change', this);
  }

  get favicon(): string | null {
    return this._favicon;
  }

  get hasTabPreview(): boolean {
    return false;
  }

  get requireAttention(): boolean {
    return this._requireAttention;
  }

  setRequireAttention(requireAttention: boolean) {
    if (this._requireAttention === requireAttention) {
      return;
    }

    this._requireAttention = requireAttention;
    this.browser.eventsChannel.emit('tab:require-attention-did-change', this);
  }

  get customTitle(): string | null {
    return this._customTitle;
  }

  setCustomTitle(customTitle: string | null) {
    if (this._customTitle === customTitle) {
      return;
    }

    this._customTitle = customTitle;
    this.browser.eventsChannel.emit('tab:title-did-change', this);
  }

  activate() {
    if (this._suspended) {
      this._suspended = false;
    }
  }

  async loadURL(url: string) {
    this._url = url;
    const userAgent = sanitizeUserAgent(this.view.webContents.getUserAgent(), new URL(url));
    try {
      await this.view.webContents.loadURL(url, { userAgent });
    } catch (error) {
      scopeLog.error(`Failed to load URL ${url} in tab`);
    }
  }

  resume() {
    if (!this._suspended) {
      return;
    }

    if (this.view.isDestroyed) {
      scopeLog.debug('Cannot resume tab because its view is destroyed');
      this.view.refreshWebContentsView();
    }

    this._suspended = false;
  }

  async loadHistoryOrURL() {
    const tabHistory = history.get(this.id);
    if (tabHistory) {
      await this.view.webContents.navigationHistory.restore(tabHistory).catch((error) => {
        scopeLog.error(
          `Failed to restore navigation history for Tab ${this.id} with WebContents ID ${this.view.webContentsId}. ` +
            `Error: ${error.message}`,
        );
      });
      return;
    }

    if (this._url) {
      await this.loadURL(this._url);
      return;
    }

    throw new Error('Cannot resume tab without URL');
  }

  suspend() {
    if (this._suspended) {
      return;
    }
    this.close();
    this._suspended = true;
  }

  close() {
    this.view.close();
    history.delete(this.id);
  }

  updateLastAccessed() {
    this._lastAccessed = Date.now();
  }

  get lastAccessed(): number {
    return this._lastAccessed;
  }

  get findInPage(): FindInPage | null {
    return this._findInPage;
  }

  startFindInPage() {
    if (this._findInPage) {
      this._findInPage.view.focus();
      return;
    }

    this._findInPage = new FindInPage(this.browser.eventsChannel, this.id);
    this.browser.eventsChannel.emit(
      'tab:find-in-page-visibility-did-change',
      this,
      true,
      this._findInPage.view,
    );
  }

  stopFindInPage() {
    if (!this._findInPage) {
      return;
    }

    const view = this._findInPage.view;
    this._findInPage.close();
    this._findInPage = null;
    this.browser.eventsChannel.emit('tab:find-in-page-visibility-did-change', this, false, view);
  }

  saveHistory() {
    history.save(this);
  }
}
