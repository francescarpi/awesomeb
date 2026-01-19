import { LSLayout } from './base';
import { Rectangle } from 'electron';

export class LSHorizontalLayout extends LSLayout {
  layout(rect: Rectangle) {
    const usableWidth = rect.width;
    const usableHeight = rect.height;

    const fixed = this.children.filter((c: any) => c.props?.height);
    const flexible = this.children.filter((c: any) => !c.props?.height);

    const fixedHeight = fixed.reduce(
      (s, c: any) =>
        s + (c.props!.height ?? 0) + (c.props?.margins[0] ?? 0) + (c.props?.margins[2] ?? 0),
      0,
    );

    const flexMargins = flexible.reduce(
      (s, c: any) => s + (c.props?.margins[0] ?? 0) + (c.props?.margins[2] ?? 0),
      0,
    );
    const flexHeight = (usableHeight - fixedHeight - flexMargins) / flexible.length;

    let y = rect.y;

    for (const child of this.children) {
      const h = (child as any).props?.height ?? flexHeight;

      child.layout({
        x: rect.x,
        y,
        width: usableWidth,
        height:
          h + ((child as any).props?.margins[0] ?? 0) + ((child as any).props?.margins[2] ?? 0),
      });

      y += h + ((child as any).props?.margins[0] ?? 0) + ((child as any).props?.margins[2] ?? 0);
    }
  }
}
