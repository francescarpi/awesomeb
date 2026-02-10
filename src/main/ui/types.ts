import { Rectangle, Session } from 'electron';
import { TPage } from '~/types';

export interface ILayoutNode {
  layout(rect: Rectangle): void;
}

export interface IViewProps {
  borderRadius?: number;
  backgroundColor?: string;
  session?: Session;
  visible?: boolean;
}

export interface IPageViewProps extends IViewProps {
  query?: Record<string, string>;
  page?: TPage;
}

export type TLayoutType = 'vertical' | 'horizontal' | Rectangle;

export type TViewId = string;
