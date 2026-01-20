import { LSLayout } from './base';
import { Rectangle } from 'electron';

export class LSHorizontalLayout extends LSLayout {
  layout(rect: Rectangle) {
    const usableWidth = rect.width;
    const usableHeight = rect.height;

    const fixed = this.visibleChildren.filter((c: any) => c.height);
    const flexible = this.visibleChildren.filter((c: any) => !c.height);

    const fixedHeight = fixed.reduce((s, c: any) => s + (c.height ?? 0), 0);
    const flexHeight = (usableHeight - fixedHeight) / flexible.length;

    let y = rect.y;

    for (const child of this.visibleChildren) {
      const margin = (child as any).margin ?? { l: 0, t: 0, r: 0, b: 0 };
      const h = (child as any).height ?? flexHeight;

      child.layout({
        x: rect.x + margin.l,
        y: y + margin.t,
        width: usableWidth - margin.l - margin.r,
        height: h - margin.t - margin.b,
      });

      y += h;
    }
  }
}
