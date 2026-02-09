import EventEmitter from 'events';
import { Partition } from '@/core';
import { ITabProps } from './types';
import { UIView } from '@/ui';
import { TTabId } from '~/types';
import log from 'electron-log';
import { session } from 'electron';
import { registerTabEvents } from './events';
import { sanitizeUserAgent } from '@/utils';

const scopeLog = log.scope('Tab');

export class Tab {
  private readonly _partition: Partition;
  private _title: string | null = null;
  private _customTitle: string | null = null;
  private _url: string | null = null;
  private _suspended: boolean = true;
  private _loading: boolean = false;
  private _favicon: string | null = null;
  private _view: UIView;
  private _lastAccessed: number = Date.now();

  constructor(
    public readonly eventsChannel: EventEmitter,
    public readonly id: TTabId,
    props: ITabProps,
  ) {
    this._partition = props.partition;
    this._title = props.title ?? null;
    this._customTitle = props.customTitle ?? null;
    this._url = props.url ?? null;
    this._suspended = props.suspended ?? true;

    // The view is not visible initially until method to refresh visible tabs is called.
    this._view = new UIView(`tab-${this.id}`, {
      visible: true,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      session: session.fromPartition(this._partition.id),
    });

    registerTabEvents(this);
  }

  get partition(): Partition {
    return this._partition;
  }

  get title(): string {
    return this._customTitle || this._title || this._url || 'Untitled';
  }

  setTitle(title: string) {
    if (this._title === title) {
      return;
    }

    this._title = title;
    this.eventsChannel.emit('tab:title-did-change', this);
  }

  get url(): string | null {
    return this._url;
  }

  setUrl(url: string) {
    if (this._url === url) {
      return;
    }

    this._url = url;
    this.eventsChannel.emit('tab:url-did-change', this);
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
    this.eventsChannel.emit('tab:loading-did-change', this);
  }

  get favicon(): string | null {
    return this._favicon;
  }

  get hasTabPreview(): boolean {
    return false;
  }

  get requireAttention(): boolean {
    return false;
  }

  get customTitle(): string | null {
    return this._customTitle;
  }

  setCustomTitle(customTitle: string | null) {
    if (this._customTitle === customTitle) {
      return;
    }

    this._customTitle = customTitle;
    this.eventsChannel.emit('tab:title-did-change', this);
  }

  get view(): UIView {
    return this._view;
  }

  activate() {
    if (this._suspended) {
      this._suspended = false;
    }
  }

  async loadURL(url: string) {
    this._url = url;
    const userAgent = sanitizeUserAgent(this._view.webContents.getUserAgent(), new URL(url));
    try {
      await this._view.webContents.loadURL(url, { userAgent });
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
      this._view.refreshWebContentsView();
    }

    this._suspended = false;
  }

  async loadHistoryOrURL() {
    // TODO if exist navigation history, restore it
    // else load the URL
    // else raise an error

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
    if (this._view.webContents !== undefined) {
      this._view.webContents.stop();
      this._view.webContents.close();
    }
  }

  updateLastAccessed() {
    this._lastAccessed = Date.now();
  }

  get lastAccessed(): number {
    return this._lastAccessed;
  }
}
