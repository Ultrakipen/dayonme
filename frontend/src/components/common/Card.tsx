import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { useModernTheme } from '../../hooks/useModernTheme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'primary' | 'success' | 'warm' | 'highlight' | 'glass';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, isDark } = useModernTheme();
  const { width: screenWidth } = useWindowDimensions();

  const scale = useMemo(() => {
    const BASE_WIDTH = 360;
    return Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.5);
  }, [screenWidth]);

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        // 2026 트렌드: 인디고/바이올렛 글래스
        return isDark ? 'rgba(99, 102, 241, 0.12)' : '#FFFFFF';
      case 'success':
        // 2026 트렌드: 에메랄드 글래스
        return isDark ? 'rgba(16, 185, 129, 0.12)' : '#FFFFFF';
      case 'warm':
        // 2026 트렌드: 앰버/골드 글래스
        return isDark ? 'rgba(245, 158, 11, 0.10)' : '#FFFFFF';
      case 'highlight':
        // 2026 트렌드: 핑크/퍼플 그라데이션 느낌
        return isDark ? 'rgba(139, 92, 246, 0.10)' : '#FFFFFF';
      case 'glass':
        // 2026 트렌드: 글래스모피즘
        return isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF';
      default:
        return colors.card;
    }
  };

  const getBorderColor = () => {
    if (isDark) {
      switch (variant) {
        case 'primary':
          return 'rgba(99, 102, 241, 0.2)';
        case 'success':
          return 'rgba(16, 185, 129, 0.2)';
        case 'warm':
          return 'rgba(245, 158, 11, 0.15)';
        case 'highlight':
          return 'rgba(139, 92, 246, 0.2)';
        case 'glass':
          return 'rgba(255, 255, 255, 0.1)';
        default:
          return 'transparent';
      }
    }
    return 'transparent';
  };

  const cardStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: 16 * scale,
    padding: 18 * scale,
    marginBottom: 12 * scale,
    borderWidth: isDark && variant !== 'default' ? 1 : 0,
    borderColor: getBorderColor(),
    // 2026 트렌드: 미세한 그림자 (라이트 모드에서 카드 구분)
    shadowColor: isDark ? 'transparent' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0 : 0.06,
    shadowRadius: 12,
    elevation: isDark ? 0 : 3,
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={cardStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </View>
  );
};
