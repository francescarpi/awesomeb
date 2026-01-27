import { Rectangle } from 'electron';
import { IMargins } from '~/types';
import { UINewLayout } from './new-layout';
import { UINewView } from './new-view';

export interface ILayoutNode {
  layout(rect: Rectangle): void;
}

export interface IViewProps {
  width?: number;
  height?: number;
}

export interface IPageViewProps extends IViewProps {
  query?: Record<string, string>;
}

export type TLayoutType = 'vertical' | 'horizontal' | Rectangle;

export type TLayoutChildren = UINewLayout | UINewView;

export interface ILayoutProps {
  margin: IMargins;
}
