import { LSLayout } from './base';
import { Rectangle } from 'electron';

export class LSHorizontalLayout extends LSLayout {
  layout(rect: Rectangle) {
    const usableWidth = rect.width - this.padding * 2;
    const usableHeight = rect.height - this.padding * 2;

    const fixed = this.children.filter((c: any) => c.fixedSize?.height);
    const flexible = this.children.filter((c: any) => !c.fixedSize?.height);

    const fixedHeight = fixed.reduce((s, c: any) => s + (c.fixedSize!.height ?? 0), 0);
    const flexHeight = (usableHeight - fixedHeight) / flexible.length;

    let y = rect.y + this.padding;

    for (const child of this.children) {
      const h = (child as any).fixedSize?.height ?? flexHeight;

      child.layout({
        x: rect.x + this.padding,
        y,
        width: usableWidth,
        height: h,
      });

      y += h;
    }
  }
}
