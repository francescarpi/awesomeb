import EventEmitter from 'events';
import { Partition } from '@/core';
import { ITabProps } from './types';
import { UIView, UILayout } from '@/ui';
import { TTabId } from '~/types';
import log from 'electron-log';
import { session } from 'electron';
import { registerTabEvents } from './events';

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
  private _layout: UILayout;
  private _viewId: TTabId = -1;
  private _lastAccessed: number = Date.now();

  constructor(
    public readonly eventsChannel: EventEmitter,
    props: ITabProps,
  ) {
    this._partition = props.partition;
    this._title = props.title ?? null;
    this._customTitle = props.customTitle ?? null;
    this._url = props.url ?? null;

    // The view is not visible initially until method to refresh visible tabs is called.
    this._view = new UIView({
      visible: true,
      margin: '5 5 5 0',
      borderRadius: 8,
      backgroundColor: '#ffffff',
      session: session.fromPartition(this._partition.id),
    });

    this._viewId = this._view.id as TTabId;

    // The tab layout will be used to show, for instance, the find in page view below the webview.
    this._layout = new UILayout(`tab-${this._view.id}`, 'horizontal');
    this._layout.addChild(this._view);

    registerTabEvents(this);
  }

  get id(): TTabId {
    return this._viewId;
  }

  get partition(): Partition {
    return this._partition;
  }

  get title(): string {
    return this._customTitle || this._title || this._url || 'Untitled';
  }

  get url(): string | null {
    return this._url;
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

    // TODO in the browser:
    //  - if tab is the active => update the url bar
    //  - if not update tabs container list only the window
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

  get layout(): UILayout {
    return this._layout;
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
    try {
      await this._view.webContents.loadURL(url);
    } catch (error) {
      scopeLog.error(`Failed to load URL ${url} in tab`);
    }
  }

  resume() {
    if (!this._suspended) {
      return;
    }

    if (this.view.isDestroyed) {
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

    // TODO save navigation history

    this._view.webContents.stop();
    this._view.webContents.close();

    this._suspended = true;
  }

  updateLastAccessed() {
    this._lastAccessed = Date.now();
  }

  get lastAccessed(): number {
    return this._lastAccessed;
  }
}
