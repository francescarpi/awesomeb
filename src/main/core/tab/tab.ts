import EventEmitter from 'events';
import { Partition } from '@/core';
import { ITabProps } from './types';
import { UIView, UIHorizontalLayout } from '@/ui';

export class Tab {
  private readonly _partition: Partition;
  private _title: string | null = null;
  private _customTitle: string | null = null;
  private _url: string | null = null;
  private _suspended: boolean = true;
  private _loading: boolean = false;
  private _favicon: string | null = null;
  private _view: UIView;
  private _layout: UIHorizontalLayout;

  constructor(
    public readonly eventsChannel: EventEmitter,
    props: ITabProps,
  ) {
    this._partition = props.partition;
    this._title = props.title ?? null;
    this._customTitle = props.customTitle ?? null;
    this._url = props.url ?? null;

    this._view = new UIView(`tab-view-${this.id}`);
    this._layout = new UIHorizontalLayout(`tab-${this.id}`);
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
}
