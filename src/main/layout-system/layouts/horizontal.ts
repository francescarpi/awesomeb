import { LSLayout } from './base';
import { Rectangle } from 'electron';

export class LSHorizontalLayout extends LSLayout {
  layout(rect: Rectangle) {
    const usableWidth = rect.width;
    const usableHeight = rect.height;

    const fixed = this.children.filter((c: any) => c.props?.height);
    const flexible = this.children.filter((c: any) => !c.props?.height);

    const fixedHeight = fixed.reduce((s, c: any) => s + (c.props!.height ?? 0), 0);
    const flexHeight = (usableHeight - fixedHeight) / flexible.length;

    let y = rect.y;

    for (const child of this.children) {
      const margin = (child as any).props?.margin ?? { left: 0, top: 0, right: 0, bottom: 0 };
      const h = (child as any).props?.height ?? flexHeight;

      child.layout({
        x: rect.x + margin.left,
        y: y + margin.top,
        width: usableWidth - margin.left - margin.right,
        height: h - margin.top - margin.bottom,
      });

      y += h;
    }
  }
}
