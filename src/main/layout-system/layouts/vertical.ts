import { LSLayout } from './base';
import { Rectangle } from 'electron';

export class LSVerticalLayout extends LSLayout {
  layout(rect: Rectangle) {
    const usableWidth = rect.width;
    const usableHeight = rect.height;

    const fixed = this.children.filter((c: any) => c.props?.width);
    const flexible = this.children.filter((c: any) => !c.props?.width);

    const fixedWidth = fixed.reduce(
      (s, c: any) =>
        s + (c.props!.width ?? 0) + (c.props?.margins[3] ?? 0) + (c.props?.margins[1] ?? 0),
      0,
    );

    const flexMargins = flexible.reduce(
      (s, c: any) => s + (c.props?.margins[3] ?? 0) + (c.props?.margins[1] ?? 0),
      0,
    );
    const flexWidth = (usableWidth - fixedWidth - flexMargins) / flexible.length;

    let x = rect.x;

    for (const child of this.children) {
      const w = (child as any).props?.width ?? flexWidth;

      child.layout({
        x,
        y: rect.y,
        width:
          w + ((child as any).props?.margins[3] ?? 0) + ((child as any).props?.margins[1] ?? 0),
        height: usableHeight,
      });

      x += w + ((child as any).props?.margins[3] ?? 0) + ((child as any).props?.margins[1] ?? 0);
    }
  }
}
