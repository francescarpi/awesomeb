import { Rectangle } from 'electron';
import { IMargins } from '~/types';

export interface ILayoutNode {
  layout(rect: Rectangle): void;
}

export interface IProps {
  width?: number;
  height?: number;
  margin?: IMargins;
  query?: Record<string, string>;
}
