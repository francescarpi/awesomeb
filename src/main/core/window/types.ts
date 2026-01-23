import { Theme } from '../themes';
import { Desktop } from '@main/core';

export interface IProps {
  theme?: Theme;
  desktops?: Desktop[];
  selectedDesktopId?: number;
}
