import { LayoutVertical } from './vertical';
import { LayoutHorizontal } from './horizontal';
export { LayoutBase } from './base';
export * from './constants';

const vertical = new LayoutVertical();
const horizontal = new LayoutHorizontal();

export const Layouts = {
  [vertical.id]: vertical,
  [horizontal.id]: horizontal,
};
