import { Rectangle } from 'electron';

export type TPage = string;

export interface IContextualModalParams {
  bounds: Rectangle;
  anchor: 'bottom-left';
}
