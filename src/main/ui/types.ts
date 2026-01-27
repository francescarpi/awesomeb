import { Rectangle } from 'electron';
import { UINewLayout } from './new-layout';
import { UINewView } from './new-view';

export interface ILayoutNode {
  layout(rect: Rectangle): void;
}

export interface IViewProps {
  width?: number;
  height?: number;
  margins?: string;
}

export interface IPageViewProps extends IViewProps {
  query?: Record<string, string>;
}

export type TLayoutType = 'vertical' | 'horizontal' | Rectangle;

export type TLayoutChildren = UINewLayout | UINewView;

export interface ILayoutProps {}
