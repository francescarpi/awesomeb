import { Rectangle } from 'electron';

export type TPage = string;

export interface IContextualModalParams {
  bounds: Rectangle;
  anchor: 'top-left' | 'bottom-left';
}
