import { LSLayoutNode } from '../types';
import { Rectangle } from 'electron';
import { LSView } from '../view';

export abstract class LSLayout implements LSLayoutNode {
  public children: LSLayoutNode[] = [];

  add(node: LSLayoutNode) {
    this.children.push(node);
  }

  abstract layout(rect: Rectangle): void;

  get views(): LSView[] {
    return this._recursiveViews(this);
  }

  private _recursiveViews(node: LSLayoutNode): LSView[] {
    let views: LSView[] = [];

    if (node instanceof LSView) {
      views.push(node as LSView);
    }

    if ('children' in node) {
      for (const child of (node as LSLayout).children) {
        views = views.concat(this._recursiveViews(child));
      }
    }

    return views;
  }

  get visibleChildren(): LSLayoutNode[] {
    return this.children.filter((c) => {
      return c instanceof LSView ? c.getVisible() : true;
    });
  }
}
