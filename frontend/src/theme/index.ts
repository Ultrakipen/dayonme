// theme/index.ts - 통합 테마 시스템 (다크모드 지원)
import { Colors, ColorTheme } from './colors';
import { Typography } from './typography';
import { Spacing } from './spacing';

export interface Theme {
  colors: {
    // 원본 Colors 객체
    raw: typeof Colors;
    // 사용하기 쉬운 테마별 색상
    primary: string;
    background: string;
    surface: string;
    card: string;
    cardHover: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    alwaysWhite: string;
    alwaysBlack: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
  };
  typography: typeof Typography;
  spacing: typeof Spacing;
  mode: ColorTheme;
  isDark: boolean;
  // 현재 테마에 따른 동적 컬러 (하위 호환성)
  bg: {
    primary: string;
    secondary: string;
    card: string;
    border: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

export const createTheme = (mode: ColorTheme = 'light'): Theme => {
  const isDark = mode === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  return {
    colors: {
      raw: Colors,
      primary: Colors.gradient.primary[0], // 그라데이션 메인 컬러 사용
      background: themeColors.background,
      surface: themeColors.surface,
      card: themeColors.card,
      cardHover: isDark ? '#333333' : '#f5f5f5',
      border: themeColors.border,
      error: Colors.error[500],
      success: Colors.success[500],
      warning: Colors.warning[500],
      info: Colors.info[500],
      alwaysWhite: '#FFFFFF',
      alwaysBlack: '#000000',
      text: {
        primary: themeColors.text,
        secondary: themeColors.textSecondary,
        tertiary: themeColors.textTertiary,
      },
    },
    typography: Typography,
    spacing: Spacing,
    mode,
    isDark,
    // 현재 테마에 따른 동적 컬러 (하위 호환성)
    bg: {
      primary: themeColors.background,
      secondary: themeColors.surface,
      card: themeColors.card,
      border: themeColors.border,
    },
    text: {
      primary: themeColors.text,
      secondary: themeColors.textSecondary,
      tertiary: themeColors.textTertiary,
    },
  };
};

// Default themes
export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');

// Export everything
export { Colors, Typography, Spacing };
export type { ColorTheme };

// Theme constants
export const THEME_MODE = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
  SYSTEM: 'system' as const,
};

// Shadow styles (모던 디자인)
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modern: {
    post: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    modal: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 12,
    },
  },
};