// hooks/useModernTheme.ts
// 기존 ModernThemeContext의 useModernTheme을 re-export (간소화된 인터페이스)
import { useModernTheme as useOriginalModernTheme } from '../contexts/ModernThemeContext';

/**
 * useModernTheme - ModernThemeContext의 간소화된 re-export
 * ReviewScreen 컴포넌트들에서 사용하기 쉽도록 colors 속성을 평탄화
 */
export const useModernTheme = () => {
  const { colors, isDark, theme, ...rest } = useOriginalModernTheme();

  return {
    colors: {
      // 기본 색상
      primary: colors.primary,
      secondary: colors.info,
      background: colors.background,
      card: colors.card,

      // 텍스트 색상 (간소화: colors.text.primary → colors.text)
      text: colors.text.primary,
      textSecondary: colors.text.secondary,
      textTertiary: colors.text.tertiary,

      // 테두리 & 구분선
      border: colors.border,

      // 상태 색상
      success: colors.success,
      error: colors.error,
      warning: colors.warning,
    },
    isDark,
    theme,
    ...rest,
  };
};

export default useModernTheme;
