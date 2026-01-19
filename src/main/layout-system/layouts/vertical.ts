import { LSLayout } from './base';
import { Rectangle } from 'electron';

export class LSVerticalLayout extends LSLayout {
  layout(rect: Rectangle) {
    const { width: usableWidth, height: usableHeight, x: initialLeft } = rect;

    const fixed = this.children.filter((c: any) => c.props?.width);
    const flexible = this.children.filter((c: any) => !c.props?.width);

    // const fixedWidth = fixed.reduce(
    //   (s, c: any) =>
    //     s + (c.props!.width ?? 0) + (c.props?.margins[3] ?? 0) + (c.props?.margins[1] ?? 0),
    //   0,
    // );
    //
    // const flexMargins = flexible.reduce(
    //   (s, c: any) => s + (c.props?.margins[3] ?? 0) + (c.props?.margins[1] ?? 0),
    //   0,
    // );
    // const flexWidth = (usableWidth - fixedWidth - flexMargins) / flexible.length;

    let x = initialLeft;

    for (const child of this.children) {
      const margins = (child as any).props?.margins ?? { left: 0, top: 0, right: 0, bottom: 0 };

      x += margins.left;
      const y = rect.y + margins.top;
      const width = (child as any).props?.width ?? usableWidth - margins.left - margins.right;
      const height = (child as any).props?.height ?? usableHeight - margins.top - margins.bottom;

      child.layout({ x, y, width: 100, height: 100 });

      x += width + margins.right;
    }
  }
}
