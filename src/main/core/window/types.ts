import { Theme } from '../themes';
import { Rectangle } from 'electron';

export interface IProps {
  theme?: Theme;
  selectedDesktopId?: number;
  bounds?: Rectangle;
}
