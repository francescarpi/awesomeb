import { LSLayout } from './base';
import { Rectangle } from 'electron';

export class LSVerticalLayout extends LSLayout {
  layout(rect: Rectangle) {
    const usableWidth = rect.width;
    const usableHeight = rect.height;

    const fixed = this.children.filter((c: any) => c.props?.width);
    const flexible = this.children.filter((c: any) => !c.props?.width);

    const fixedWidth = fixed.reduce((s, c: any) => s + (c.props!.width ?? 0), 0);
    const flexWidth = (usableWidth - fixedWidth) / flexible.length;

    let x = rect.x;

    for (const child of this.children) {
      const margin = (child as any).props?.margin ?? { left: 0, top: 0, right: 0, bottom: 0 };
      const w = (child as any).props?.width ?? flexWidth;

      child.layout({
        x: x + margin.left,
        y: rect.y + margin.top,
        width: w - margin.left - margin.right,
        height: usableHeight - margin.top - margin.bottom,
      });

      x += w;
    }
  }
}
