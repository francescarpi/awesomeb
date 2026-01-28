import EventEmitter from 'events';
import { Partition } from '@/core';
import { ITabProps } from './types';
import { UIView, UILayout } from '@/ui';

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

  constructor(
    public readonly eventsChannel: EventEmitter,
    props: ITabProps,
  ) {
    this._partition = props.partition;
    this._title = props.title ?? null;
    this._customTitle = props.customTitle ?? null;
    this._url = props.url ?? null;

    // The view is not visible initially until method to refresh visible tabs is called.
    this._view = new UIView({ visible: false });

    // The tab layout will be used to show, for instance, the find in page view below the webview.
    this._layout = new UILayout(`tab-${this._view.id}`, 'horizontal');
    this._layout.addChild(this._view);
  }

  get id(): number {
    return this._view.id as number;
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
    if (this._suspended) {
      this.activate();
    }

    await this._view.webContents.loadURL(url);
  }
}
