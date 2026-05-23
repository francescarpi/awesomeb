export type { ITabMark } from '@/core/tab-marks/schemes';

export type TMarksAction =
  | { id: 'deleteAll' }
  | { id: 'deleteOne' }
  | { id: 'add'; trigger: string }
  | { id: 'select'; trigger: string };
