import { Rectangle } from 'electron';

export interface LSLayoutNode {
  layout(rect: Rectangle): void;
}
