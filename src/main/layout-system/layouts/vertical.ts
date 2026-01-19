import { LSLayout } from './base';
import { Rectangle } from 'electron';

export class LSVerticalLayout extends LSLayout {
  layout(rect: Rectangle) {
    const usableWidth = rect.width - this.padding * 2;
    const usableHeight = rect.height - this.padding * 2;

    const fixed = this.children.filter((c: any) => c.fixedSize?.width);
    const flexible = this.children.filter((c: any) => !c.fixedSize?.width);

    const fixedWidth = fixed.reduce((s, c: any) => s + (c.fixedSize!.width ?? 0), 0);
    const flexWidth = (usableWidth - fixedWidth) / flexible.length;

    let x = rect.x + this.padding;

    for (const child of this.children) {
      const w = (child as any).fixedSize?.width ?? flexWidth;

      child.layout({
        x,
        y: rect.y + this.padding,
        width: w,
        height: usableHeight,
      });

      x += w;
    }
  }
}
