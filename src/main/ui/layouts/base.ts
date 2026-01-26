import { ILayoutNode } from '../types';
import { Rectangle } from 'electron';
import { UIView } from '../view';

export abstract class UILayout implements ILayoutNode {
  public children: ILayoutNode[] = [];

  constructor(public readonly id: string) {}

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
      return c instanceof UIView ? c.wcv.getVisible() : true;
    });
  }

  getNodeById<T extends { id: number | string }>(id: string | number): T | null {
    if (this.id === id) {
      return this as unknown as T;
    }

    for (const child of this.children) {
      if ((child as unknown as T).id === id) {
        return child as unknown as T;
      }
      if ('getNodeById' in child) {
        const result = (child as UILayout).getNodeById(id);
        if (result) {
          return result as unknown as T;
        }
      }
    }

    return null;
  }
}
