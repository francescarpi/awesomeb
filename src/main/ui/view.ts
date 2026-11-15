import { WebContentsView, Rectangle, WebContents, Session } from 'electron';
import { IViewProps, IPageViewProps, TViewId } from './types';
import { loadPage, openDevTools } from './helpers';
import { partitions, Window } from '@/core';
import { buildScopeLog } from '@/utils';
import { LAYOUT_ANIMATION_DURATION } from '~/constants';

const scopeLog = buildScopeLog('UIView', process.env.AB_LOG_UI === 'true');

// Target frame interval for the bounds interpolation (~60fps).
const BOUNDS_ANIMATION_FRAME_INTERVAL = 16;

export interface IViewBoundsOptions {
  /**
   * Animate the bounds change instead of applying it instantly.
   */
  animate?: boolean;
}

/**
 * Cubic bezier easing, matching the CSS `ease-in-out` keyword
 * (cubic-bezier(0.42, 0, 0.58, 1)).
 */
function easeInOut(t: number): number {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  const f = -2 * t + 2;
  return 1 - (f * f * f) / 2;
}

export class UIView {
  protected _webContentsView: WebContentsView;

  private readonly _borderRadius: number;
  private readonly _backgroundColor: string;
  private readonly _preferredSizeMode: boolean;

  private _session: Session;
  private _boundsAnimationTimer: ReturnType<typeof setTimeout> | undefined;
  private _targetBounds: Rectangle | undefined;

  constructor(
    public readonly viewId: TViewId,
    props?: IViewProps,
  ) {
    this._borderRadius = props?.borderRadius || 0;
    this._backgroundColor = props?.backgroundColor || '#00000000';
    this._preferredSizeMode = props?.preferredSizeMode ?? false;
    this._session = props?.session || partitions.internal.ses;

    this._webContentsView = this._createWebContentsView();

    const visible = props?.visible ?? true;
    this.setVisible(visible);
  }

  private _createWebContentsView(): WebContentsView {
    const wcv = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        spellcheck: true,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        transparent: true,
        enablePreferredSizeMode: this._preferredSizeMode,
        session: this._session,
      },
    });

    wcv.setBorderRadius(this._borderRadius);

    wcv.setBackgroundColor(this._backgroundColor);

    return wcv;
  }

  refreshWebContentsView() {
    this._webContentsView = this._createWebContentsView();
  }

  get webContentsId(): number {
    // Dont delete - used in some places
    if (this.webContents === undefined) {
      scopeLog.error('WebContents is undefined for view:', this.viewId);
      return -1;
    }

    return this.webContents.id;
  }

  get isDestroyed(): boolean {
    return this.webContents === undefined || this.webContents.isDestroyed();
  }

  get webContentsView(): WebContentsView {
    return this._webContentsView;
  }

  get webContents(): WebContents {
    return this._webContentsView.webContents;
  }

  get bounds(): Rectangle {
    return this._webContentsView.getBounds();
  }

  get width(): number {
    return this.bounds.width;
  }

  get height(): number {
    return this.bounds.height;
  }

  get top(): number {
    return this.bounds.y;
  }

  get left(): number {
    return this.bounds.x;
  }

  setWidth(width: number) {
    this._webContentsView.setBounds({ ...this.bounds, width });
  }

  setSize(width: number, height: number) {
    this._webContentsView.setBounds({ ...this.bounds, width, height });
  }

  get visible(): boolean {
    return this._webContentsView.getVisible();
  }

  setVisible(visible: boolean) {
    this._webContentsView.setVisible(visible);
  }

  setBounds(bounds: Rectangle, options?: IViewBoundsOptions) {
    this._targetBounds = bounds;

    if (!options?.animate) {
      this.cancelBoundsAnimation();
      this._webContentsView.setBounds(bounds);
      return;
    }

    this.animateBounds(bounds);
  }

  /**
   * Animates the bounds by interpolating them on a timer and applying the
   * intermediate values with plain (non animated) `setBounds` calls.
   *
   * We do not use Electron's native `setBounds(bounds, { animate })` because it
   * is asymmetric:
   * - When GROWING, Electron resizes the view to the larger size up front and
   *   animates the layer clip rect, so the page is laid out at the final size
   *   and revealed progressively.
   * - When SHRINKING, the view is not resized, so the web contents surface
   *   keeps its old (larger) size and the compositor scales it into the
   *   smaller box. The page looks stretched and is not re-laid out until the
   *   animation ends.
   *
   * Interpolating ourselves keeps both directions identical: the view is
   * resized on every frame, so the page is always laid out at the current
   * size and never appears scaled.
   */
  private animateBounds(target: Rectangle) {
    this.cancelBoundsAnimation();

    const from = this.bounds;
    const start = Date.now();

    // Nothing to animate.
    if (
      from.x === target.x &&
      from.y === target.y &&
      from.width === target.width &&
      from.height === target.height
    ) {
      return;
    }

    const step = () => {
      if (this.isDestroyed) {
        this._boundsAnimationTimer = undefined;
        return;
      }

      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / LAYOUT_ANIMATION_DURATION, 1);
      const eased = easeInOut(progress);

      if (progress >= 1) {
        this._boundsAnimationTimer = undefined;
        this._webContentsView.setBounds(target);
        return;
      }

      this._webContentsView.setBounds({
        x: Math.round(from.x + (target.x - from.x) * eased),
        y: Math.round(from.y + (target.y - from.y) * eased),
        width: Math.round(from.width + (target.width - from.width) * eased),
        height: Math.round(from.height + (target.height - from.height) * eased),
      });

      this._boundsAnimationTimer = setTimeout(step, BOUNDS_ANIMATION_FRAME_INTERVAL);
    };

    step();
  }

  private cancelBoundsAnimation() {
    if (this._boundsAnimationTimer) {
      clearTimeout(this._boundsAnimationTimer);
      this._boundsAnimationTimer = undefined;
    }
  }

  /**
   * The bounds the view is heading towards. While an animation is running this
   * is the final geometry, not the current (intermediate) one.
   */
  get targetBounds(): Rectangle {
    return this._targetBounds ?? this.bounds;
  }

  send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }

  reload() {
    this.webContents.reload();
  }

  get canGoBack(): boolean {
    return this.webContents?.navigationHistory.canGoBack() || false;
  }

  get canGoForward(): boolean {
    return this.webContents?.navigationHistory.canGoForward() || false;
  }

  goBack() {
    if (this.canGoBack) {
      this.webContents.navigationHistory.goBack();
    }
  }

  goForward() {
    if (this.canGoForward) {
      this.webContents.navigationHistory.goForward();
    }
  }

  checkVisibility(_window: Window) {}

  refreshBounds(_window: Window, _options?: IViewBoundsOptions) {
    throw new Error('Not implemented render for UIView');
  }

  closeWebContents() {
    if (this.webContents !== undefined) {
      this.webContents.stop();
      this.webContents.close();
    }
  }

  focus() {
    if (this.webContents !== undefined) {
      this.webContents.focus();
    }
  }

  print() {
    if (this.webContents !== undefined) {
      this.webContents.print();
    }
  }

  preventLostFocusWhenVisible() {
    this.webContents.on('blur', () => {
      if (this.visible) {
        setTimeout(() => {
          this.focus();
        });
      }
    });
  }
}

export class UIPageView extends UIView {
  constructor(id: TViewId, props?: IPageViewProps) {
    super(id, props);

    loadPage(this.webContents, props?.page || id, props?.query);

    openDevTools(this.webContents, props?.page || id);
  }
}
