import { Theme } from '../themes';
import { Desktop } from '@/core';

export interface IProps {
  theme?: Theme;
  desktops?: Desktop[];
  selectedDesktopId?: number;
}
