import type { Animations, Density, TextSize, TextWeight } from '../enums';
import type { ThemeSettings } from './ThemeSettings';

export type BaseSettings = ThemeSettings & {
  textSize: TextSize;
  textWeight: TextWeight;
  displayDensity: Density;
  borderRadius: number;
  animations: Animations;
  themeId: string;
  // Shortcuts
  enableShortcutKeys: boolean;
  shortcutKeyLocation: 'left' | 'right' | 'hidden';
  shortcutKeyColor: 'primary' | 'secondary' | 'accent';

  showHelpText: boolean;
};
