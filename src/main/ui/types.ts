import { Rectangle } from 'electron';

export interface ILayoutNode {
  layout(rect: Rectangle): void;
}
