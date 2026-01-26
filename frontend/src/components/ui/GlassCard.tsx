// 글래스모피즘 카드 컴포넌트
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { normalizeSpace, normalizeBorderRadius } from '../../utils/responsive';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'light' | 'medium' | 'strong';
  blur?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 'medium',
  blur = true
}) => {
  const { isDark } = useModernTheme();

  const getGlassStyle = () => {
    const baseStyle = {
      borderRadius: normalizeBorderRadius(16),
      borderWidth: 1,
      overflow: 'hidden' as const,
    };

    if (isDark) {
      // 다크모드 글래스 효과
      switch (intensity) {
        case 'light':
          return {
            ...baseStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          };
        case 'strong':
          return {
            ...baseStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderColor: 'rgba(255, 255, 255, 0.25)',
          };
        default: // medium
          return {
            ...baseStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.18)',
          };
      }
    } else {
      // 라이트모드 글래스 효과
      switch (intensity) {
        case 'light':
          return {
            ...baseStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderColor: 'rgba(255, 255, 255, 0.8)',
          };
        case 'strong':
          return {
            ...baseStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgba(255, 255, 255, 1)',
          };
        default: // medium
          return {
            ...baseStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.9)',
          };
      }
    }
  };

  return (
    <View
      style={[
        getGlassStyle(),
        {
          shadowColor: isDark ? '#000' : '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 8,
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

export default GlassCard;
