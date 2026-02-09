import { Rectangle, Session } from 'electron';

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
}

export type TLayoutType = 'vertical' | 'horizontal' | Rectangle;

export type TViewId = string;
