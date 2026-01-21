import { UILayout } from './base';
import { Rectangle } from 'electron';

export class UIVerticalLayout extends UILayout {
  layout(rect: Rectangle) {
    const usableWidth = rect.width;
    const usableHeight = rect.height;

    const fixed = this.visibleChildren.filter((c: any) => c.width);
    const flexible = this.visibleChildren.filter((c: any) => !c.width);

    const fixedWidth = fixed.reduce((s, c: any) => s + (c.width ?? 0), 0);
    const flexWidth = (usableWidth - fixedWidth) / flexible.length;

    let x = rect.x;

    for (const child of this.visibleChildren) {
      const margin = (child as any).margin ?? { l: 0, t: 0, r: 0, b: 0 };
      const w = (child as any).width ?? flexWidth;

      child.layout({
        x: x + margin.l,
        y: rect.y + margin.t,
        width: w - margin.l - margin.r,
        height: usableHeight - margin.t - margin.b,
      });

      x += w;
    }
  }
}
