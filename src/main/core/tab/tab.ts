import { Partition, history, Browser, Window } from '@/core';
import {
  ITabProps,
  TBasicAuthCallback,
  TCertificateCallback,
  TPermissionRequestCallback,
} from './types';
import { TTabId, IMediaSessionInfo } from '~/types';
import log from 'electron-log';
import { registerTabEvents } from './events';
import { FindInPage } from './find-in-page';
import { FailLoad } from './fail-load';
import { Certificate } from 'electron';
import { CertificateError } from './certificate-error';
import { TabPreview } from './tab-preview';
import { MARGIN, Sidebar, UIView, URLBar } from '@/ui';
import { FIND_IN_PAGE_VIEW_HEIGHT } from './constants';

const scopeLog = log.scope('Tab');

export class Tab extends UIView {
  private readonly _partition: Partition;
  private _title: string | null = null;
  private _customTitle: string | null = null;
  private _url: string | null = null;
  private _suspended: boolean = true;
  private _loading: boolean = false;
  private _favicon: string | null = null;
  private _lastAccessed: number = Date.now();
  private _findInPage: FindInPage | null = null;
  private _requireAttention: boolean = false;
  private _failLoad: FailLoad | null = null;
  private _basicAuthCallback: TBasicAuthCallback | null = null;
  private _clientCertificatesAndCallback: [Certificate[], TCertificateCallback] | null = null;
  private _safe: boolean = true;
  private _certificateError: CertificateError | null = null;
  private _requestPermission: [string, string, TPermissionRequestCallback] | null = null;
  private _parent: Tab | null = null;
  private _preview: TabPreview | null = null;
  private _eventsRegistered: boolean = false;
  private _zoomStep: number = 0;
  private static readonly MIN_ZOOM_STEP = -5;
  private static readonly MAX_ZOOM_STEP = 9;
  private _mediaSessionInfo: IMediaSessionInfo | null = null;
  private _closedAt: number | null = null;

  constructor(
    public readonly browser: Browser,
    public readonly id: TTabId,
    props: ITabProps,
  ) {
    super(`tab-${id}#`, {
      visible: false,
      borderRadius: 12,
      backgroundColor: '#ffffff',
      session: props.partition.ses,
    });

    this._partition = props.partition;
    this._title = props.title ?? null;
    this._customTitle = props.customTitle ?? null;
    this._url = props.url ?? null;
    this._suspended = props.suspended ?? true;
    this._parent = props.parent ?? null;
    this._favicon = props.favicon ?? null;
    this._closedAt = props.closedAt ?? null;

    registerTabEvents(browser, this);
  }

  checkVisibility(window: Window) {
    const selectedTab = window.selectedTab;
    const visibleTabs: number[] = [];

    if (selectedTab) {
      const tabContainer = selectedTab.tabContainer;
      for (const tab of tabContainer.tabs) {
        visibleTabs.push(tab.id);
        if (tab.tabPreview) {
          visibleTabs.push(tab.tabPreview.tab.id);
        }
      }
    }

    this.setVisible(visibleTabs.includes(this.id));
  }

  refreshBounds(window: Window) {
    const selectedTab = window.selectedTab;

    // Calculate bounds...
    const bounds = window.bounds;
    if (window.fullScreen) {
      this.webContentsView.setBounds({
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height,
      });
      this.webContentsView.setBorderRadius(0);
      return;
    }

    this.webContentsView.setBorderRadius(12);

    const sidebar = window.getView<Sidebar>('sidebar')!;
    const urlbar = window.getView<URLBar>('urlbar')!;

    let x = sidebar.left + sidebar.width;
    let y = urlbar.top + urlbar.height + MARGIN;
    let width = bounds.width - x - MARGIN;
    let height = bounds.height - y - MARGIN;

    if (window.areaMaximized) {
      x = MARGIN;
      width = bounds.width - MARGIN * 2;
    }

    if (this.findInPage) {
      height -= FIND_IN_PAGE_VIEW_HEIGHT + MARGIN;
    }

    // Split tabs calculation
    if (selectedTab?.tabContainer.isSplit) {
      const firstTab = selectedTab.tabContainer.visibleTabs[0];
      const tabIdToCompare = this.isPreview ? this.parentTab!.id : this.id;
      const tabNum = firstTab.id === tabIdToCompare ? 1 : 2;

      const percentSize = selectedTab.tabContainer.layoutSize;

      const positon = selectedTab.tabContainer.layout.calculateBounds(
        { x, y, width, height },
        tabNum,
        percentSize,
      );

      x = positon.x;
      y = positon.y;
      width = positon.width;
      height = positon.height;
    }

    if (this.isPreview) {
      // Adjust position inside the preview layout
      x += 16;
      y += 16;
      width -= 65;
      height -= 16 * 2;
    }

    // Apply bounds
    this.webContentsView.setBounds({
      x,
      y,
      width,
      height,
    });
  }

  get partition(): Partition {
    return this._partition;
  }

  get title(): string {
    return this._customTitle || this._title || this._url || 'Untitled';
  }

  get rawTitle(): string {
    return this._title || 'Untitled';
  }

  setTitle(title: string): boolean {
    if (this._title === title) {
      return false;
    }

    this._title = title;
    this.browser.eventsChannel.emit('tab:title-did-change', this);

    return true;
  }

  setFavicon(favicon: string): boolean {
    if (this._favicon === favicon) {
      return false;
    }

    this._favicon = favicon;
    this.browser.eventsChannel.emit('tab:favicon-did-change', this);
    return true;
  }

  get url(): string | null {
    return this._url;
  }

  setUrl(url: string) {
    if (this._url === url || url === 'about:blank') {
      return;
    }

    scopeLog.debug(`Tab ${this.id} URL changed to ${url}`);
    this._url = url;
    this.browser.eventsChannel.emit('tab:url-did-change', this);
  }

  get suspended(): boolean {
    return this._suspended;
  }

  get loading(): boolean {
    return this._loading;
  }

  get webContentsLoading(): boolean {
    if (this.isDestroyed) {
      return false;
    }
    return this.webContents.isLoading();
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
    return !!this._preview;
  }

  get requireAttention(): boolean {
    return this._requireAttention;
  }

  setRequireAttention(requireAttention: boolean) {
    if (this._requireAttention === requireAttention) {
      return;
    }

    if (requireAttention && this.isMuted) {
      // If muted, we don't want to require attention because the user won't hear it anyway
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

    if (typeof customTitle === 'string' && customTitle.trim() === '') {
      this._customTitle = null;
    } else {
      this._customTitle = customTitle;
    }

    this.browser.eventsChannel.emit('tab:title-did-change', this);
  }

  activate() {
    if (this._suspended) {
      this._suspended = false;
    }
  }

  async loadURL(url: string) {
    this._url = url;
    try {
      await this.webContents.loadURL(url);
    } catch (error) {
      scopeLog.error(`Failed to load URL ${url} in tab`);
    }
  }

  resume() {
    if (!this._suspended) {
      return;
    }

    if (this.isDestroyed) {
      scopeLog.debug('Cannot resume tab because its view is destroyed');
      this.refreshWebContentsView();
    }

    this.browser.reindexWebContents(this);

    registerTabEvents(this.browser, this);

    this._suspended = false;
  }

  async loadHistoryOrURL() {
    scopeLog.info(
      `Attempting to restore navigation history for Tab ${this.id} with WebContents ID ${this.webContentsId}`,
    );

    const tabHistory = history.get(this.id);
    if (tabHistory && tabHistory.entries.length > 0) {
      await this.webContents.navigationHistory.restore(tabHistory).catch((error) => {
        scopeLog.error(
          `Failed to restore navigation history for Tab ${this.id} with WebContents ID ${this.webContentsId}. ` +
            `Error: ${error.message}`,
        );
      });
      return;
    }

    scopeLog.debug(
      `No navigation history found for Tab ${this.id} with WebContents ID ${this.webContentsId}`,
    );

    if (this._url) {
      scopeLog.debug(
        `Loading URL ${this._url} for Tab ${this.id} with WebContents ID ${this.webContentsId}`,
      );
      await this.loadURL(this._url);
      return;
    }

    throw new Error('Cannot resume tab without URL');
  }

  suspend() {
    if (this._suspended) {
      return;
    }

    if (!this.isDestroyed) {
      this.browser.removeWebContentsIndex(this.webContentsId);
    }

    this._loading = false;
    this.clearFailLoad();
    this.closeWebContents();
    this._suspended = true;
    this._eventsRegistered = false;
    this.setMediaSessionInfo(null);
  }

  markAsClosed() {
    this.closeWebContents();
    this.clearFailLoad();
    this._closedAt = Date.now();
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
      this._findInPage.focus();
      return;
    }

    this._findInPage = new FindInPage(this.browser.eventsChannel, this);
    this.browser.eventsChannel.emit(
      'tab:find-in-page-visibility-did-change',
      this,
      true,
      this._findInPage,
    );
  }

  stopFindInPage() {
    if (!this._findInPage) {
      return;
    }

    const view = this._findInPage;
    this._findInPage.closeWebContents();
    this._findInPage = null;
    this.browser.eventsChannel.emit('tab:find-in-page-visibility-did-change', this, false, view);
  }

  saveHistory() {
    history.save(this);
  }

  setFailLoad(code: number, description: string, url: string) {
    this.setLoading(false);

    if (this._failLoad) {
      return;
    }

    this._failLoad = new FailLoad(this, code, description, url);

    this.browser.eventsChannel.emit('tab:fail-load-did-change', this, true, this._failLoad);
  }

  get failLoad(): FailLoad | null {
    return this._failLoad;
  }

  clearFailLoad() {
    if (!this._failLoad) {
      return;
    }

    const view = this._failLoad;
    this._failLoad = null;
    this.browser.eventsChannel.emit('tab:fail-load-did-change', this, false, view);
  }

  setBasicAuthCallback(callback: TBasicAuthCallback | null) {
    this._basicAuthCallback = callback;
  }

  get basicAuthCallback(): TBasicAuthCallback | null {
    return this._basicAuthCallback;
  }

  setClientCertificates(data: [Certificate[], TCertificateCallback] | null) {
    this._clientCertificatesAndCallback = data;
  }

  get clientCertificates(): [Certificate[], TCertificateCallback] | null {
    return this._clientCertificatesAndCallback;
  }

  get safe(): boolean {
    return this._safe;
  }

  setCertificateError(url: string, error: string, callback: (isTrusted: boolean) => void) {
    if (this._certificateError) {
      return;
    }

    this._safe = false;
    this._certificateError = new CertificateError(this, url, error, callback);
    this.browser.eventsChannel.emit('tab:certificate-error-did-change', this, true);
  }

  get certificateError(): CertificateError | null {
    return this._certificateError;
  }

  cleanCertificateError() {
    if (!this._certificateError) {
      return;
    }

    this._safe = true;
    this._certificateError = null;
    this.browser.eventsChannel.emit('tab:certificate-error-did-change', this, false);
  }

  setRequestPermission(data: [string, string, TPermissionRequestCallback] | null) {
    this._requestPermission = data;
  }

  get requestPermission(): [string, string, TPermissionRequestCallback] | null {
    return this._requestPermission;
  }

  get parentTab(): Tab | null {
    return this._parent;
  }

  setTabPreview(previewTab: TabPreview | null) {
    if (this._preview === previewTab) {
      return;
    }

    this._preview = previewTab;
  }

  get tabPreview(): TabPreview | null {
    return this._preview;
  }

  get isPreview(): boolean {
    return this._parent !== null;
  }

  clearParent() {
    this._parent = null;
  }

  toggleMute() {
    const muted = this.isMuted;
    this.webContents.setAudioMuted(!muted);
    this.browser.eventsChannel.emit('tab:audio-mute-did-change', this);
  }

  get isMuted(): boolean {
    if (this.isDestroyed) {
      return false;
    }
    return this.webContents.audioMuted;
  }

  get eventsRegistered(): boolean {
    return this._eventsRegistered;
  }

  set eventsRegistered(value: boolean) {
    this._eventsRegistered = value;
  }

  setZoom(type: 'in' | 'out' | 'reset') {
    switch (type) {
      case 'in':
        this._zoomStep = Math.min(this._zoomStep + 1, Tab.MAX_ZOOM_STEP);
        break;
      case 'out':
        this._zoomStep = Math.max(this._zoomStep - 1, Tab.MIN_ZOOM_STEP);
        break;
      case 'reset':
        this._zoomStep = 0;
        break;
    }
    this.webContents.setZoomFactor((100 + this._zoomStep * 10) / 100);
  }

  get mediaSessionInfo(): IMediaSessionInfo | null {
    return this._mediaSessionInfo;
  }

  setMediaSessionInfo(info: IMediaSessionInfo | null) {
    this._mediaSessionInfo = info;
    this.browser.eventsChannel.emit('tab:media-session-info-did-change', this);
  }

  get closedAt(): number | null {
    return this._closedAt;
  }

  get isClosed(): boolean {
    return this._closedAt !== null;
  }

  openClosedTab() {
    if (!this.isClosed) {
      scopeLog.warn(`Attempted to open a tab that is not closed (Tab ID: ${this.id})`);
      return;
    }

    this._closedAt = null;
  }
}
