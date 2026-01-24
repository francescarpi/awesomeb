import { Theme } from '../themes';
import { Desktop } from '@/core';
import { Rectangle } from 'electron';

export interface IProps {
  theme?: Theme;
  desktops?: Desktop[];
  selectedDesktopId?: number;
  bounds?: Rectangle;
}
