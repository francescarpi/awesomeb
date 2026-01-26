import { Rectangle } from 'electron';
import { IMargins } from '~/types';

export interface ILayoutNode {
  layout(rect: Rectangle): void;
}

export interface IViewProps {
  width?: number;
  height?: number;
  margin?: IMargins;
}

export interface IPageViewProps extends IViewProps {
  query?: Record<string, string>;
}
