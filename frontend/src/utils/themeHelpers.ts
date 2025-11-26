// utils/themeHelpers.ts - 다크모드 적용 헬퍼 함수

/**
 * 다크모드 적용 가이드
 *
 * 1. 기본 사용법:
 * ```typescript
 * import { useModernTheme } from '@/contexts/ModernThemeContext';
 *
 * const MyComponent = () => {
 *   const { theme, isDark } = useModernTheme();
 *
 *   return (
 *     <View style={{ backgroundColor: theme.bg.primary }}>
 *       <Text style={{ color: theme.text.primary }}>Hello</Text>
 *     </View>
 *   );
 * };
 * ```
 *
 * 2. 동적 스타일:
 * ```typescript
 * const styles = {
 *   container: {
 *     backgroundColor: theme.bg.primary,
 *     borderColor: theme.bg.border,
 *   },
 *   text: {
 *     color: theme.text.primary,
 *   },
 *   secondaryText: {
 *     color: theme.text.secondary,
 *   }
 * };
 * ```
 *
 * 3. 테마 전환:
 * ```typescript
 * const { toggleTheme, setThemePreference } = useModernTheme();
 *
 * // 라이트/다크 토글
 * toggleTheme();
 *
 * // 특정 테마 설정
 * setThemePreference('dark');
 * setThemePreference('light');
 * setThemePreference('system'); // 시스템 설정 따르기
 * ```
 */

import { Theme } from '../theme';

/**
 * 테마별 색상 반환 (inline 스타일용)
 */
export const getThemedColor = (theme: Theme, type: 'bg' | 'text', variant: 'primary' | 'secondary' | 'tertiary' = 'primary'): string => {
  if (type === 'bg') {
    switch (variant) {
      case 'primary': return theme.bg.primary;
      case 'secondary': return theme.bg.secondary;
      case 'tertiary': return theme.bg.card;
      default: return theme.bg.primary;
    }
  } else {
    switch (variant) {
      case 'primary': return theme.text.primary;
      case 'secondary': return theme.text.secondary;
      case 'tertiary': return theme.text.tertiary;
      default: return theme.text.primary;
    }
  }
};

/**
 * 다크모드 대응 shadow (Android elevation은 자동 적용)
 */
export const getThemedShadow = (isDark: boolean, size: 'small' | 'medium' | 'large' = 'medium') => {
  const shadows = {
    small: {
      shadowColor: isDark ? '#fff' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.1 : 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: isDark ? '#fff' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.15 : 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: isDark ? '#fff' : '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.2 : 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  };

  return shadows[size];
};

/**
 * 다크모드 대응 border color
 */
export const getThemedBorderColor = (theme: Theme, opacity: number = 1): string => {
  const borderColor = theme.bg.border;
  if (opacity === 1) return borderColor;

  // opacity 적용 (hex to rgba)
  return `${borderColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};
