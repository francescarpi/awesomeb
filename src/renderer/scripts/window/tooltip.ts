import { TWindowId } from '~/types';

export class Tooltip {
  private currentTarget: HTMLElement | null = null;
  private showTimer: number | null = null;
  private hideTimer: number | null = null;
  private currentTooltip: string | null = null;
  private visible: boolean = false;
  private readonly SHOW_DELAY = 600;
  private readonly HIDE_DELAY = 100;

  constructor(private readonly winId: TWindowId) {}

  start() {
    document.addEventListener('mouseover', this.onMouseOver, true);
    document.addEventListener('mouseout', this.onMouseOut, true);
  }

  private onMouseOver = (e: MouseEvent) => {
    if (e.target === this.currentTarget) return;

    const el = (e.target as Element).closest<HTMLElement>('[data-tooltip]');
    if (!el) {
      this.scheduleHide();
      return;
    }

    const tooltipPosition = el.getAttribute('data-tooltip-position');
    const tooltip = el.getAttribute('data-tooltip');
    if (!tooltip) {
      this.scheduleHide();
      return;
    }

    this.cancelHide();

    if (this.currentTarget !== el && this.showTimer !== null) {
      window.clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    if (this.currentTooltip === tooltip && this.currentTarget === el) return;

    this.currentTarget = el;
    this.currentTooltip = tooltip;

    this.showTimer = window.setTimeout(() => {
      const x = this.tooltipPosition(tooltipPosition, e.clientX + 20);
      this.show(el, tooltip, x, el.getBoundingClientRect().y);
      this.visible = true;
      this.showTimer = null;
    }, this.SHOW_DELAY);
  };

  private tooltipPosition = (position: string | null, defaultValue: number): number => {
    switch (position) {
      case 'sidebar-end': {
        const el = document.getElementById('sidebar-tabs');
        if (el) {
          return (el as HTMLDivElement).getBoundingClientRect().right + 5;
        }
        break;
      }
    }
    return defaultValue;
  };

  private onMouseOut = (e: MouseEvent) => {
    const related = e.relatedTarget as Element | null;
    const el = e.target as Element;
    const stillInside = related?.closest('[data-tooltip]') === el.closest('[data-tooltip]');
    if (stillInside) return;
    this.scheduleHide();
  };

  private scheduleHide = () => {
    if (this.hideTimer !== null) return;

    // Cancel any pending show — if the user moves away before SHOW_DELAY,
    // we don't want a stale tooltip to appear after the hide.
    if (this.showTimer !== null) {
      window.clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    this.hideTimer = window.setTimeout(() => {
      // Only fire IPC hide if we actually showed a tooltip.
      if (this.visible) {
        this.hide();
        this.visible = false;
      }
      this.hideTimer = null;
      this.currentTarget = null;
      this.currentTooltip = null;
    }, this.HIDE_DELAY);
  };

  private cancelHide = () => {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  };

  private show = (_el: HTMLElement, text: string, x: number, y: number) => {
    abTooltip.show(this.winId, text, Math.round(x), Math.round(y));
  };

  private hide = () => {
    abTooltip.hide(this.winId);
  };
}
