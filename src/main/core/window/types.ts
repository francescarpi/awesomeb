import { Theme } from '../themes';
import { Rectangle } from 'electron';

export interface IProps {
  theme?: Theme;
  withDesktops?: boolean;
  selectedDesktopId?: number;
  bounds?: Rectangle;
}

export interface ISelectTabProps {
  sameDesktop?: boolean;
}
