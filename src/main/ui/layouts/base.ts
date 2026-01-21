import { ILayoutNode } from '../types';
import { Rectangle } from 'electron';
import { UIView } from '../view';

export abstract class UILayout implements ILayoutNode {
  public children: ILayoutNode[] = [];

  add(node: ILayoutNode) {
    this.children.push(node);
  }

  abstract layout(rect: Rectangle): void;

  get views(): UIView[] {
    return this._recursiveViews(this);
  }

  private _recursiveViews(node: ILayoutNode): UIView[] {
    let views: UIView[] = [];

    if (node instanceof UIView) {
      views.push(node as UIView);
    }

    if ('children' in node) {
      for (const child of (node as UILayout).children) {
        views = views.concat(this._recursiveViews(child));
      }
    }

    return views;
  }

  get visibleChildren(): ILayoutNode[] {
    return this.children.filter((c) => {
      return c instanceof UIView ? c.getVisible() : true;
    });
  }
}
