import { LSLayoutNode } from '../types';
import { Rectangle } from 'electron';

export abstract class LSLayout implements LSLayoutNode {
  protected children: LSLayoutNode[] = [];

  add(node: LSLayoutNode) {
    this.children.push(node);
  }

  abstract layout(rect: Rectangle): void;
}
