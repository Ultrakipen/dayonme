// components/InstagramThemed/StyledCard.tsx - 인스타그램 스타일 카드 컴포넌트
import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { Shadows } from '../../theme';

interface StyledCardProps extends ViewProps {
  variant?: 'default' | 'post' | 'elevated' | 'flat';
  padding?: keyof typeof import('../../theme/spacing').Spacing | number;
  margin?: keyof typeof import('../../theme/spacing').Spacing | number;
  shadow?: boolean;
  borderRadius?: number;
  backgroundColor?: string;
}

export const StyledCard: React.FC<StyledCardProps> = ({
  children,
  style,
  variant = 'default',
  padding,
  margin,
  shadow = true,
  borderRadius,
  backgroundColor,
  ...props
}) => {
  const { theme } = useModernTheme();

  // 변형별 기본 스타일
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'post':
        return {
          backgroundColor: backgroundColor || theme.colors.card,
          borderRadius: borderRadius ?? 0,
          ...(shadow ? Shadows.instagram.post : {}),
        };
      case 'elevated':
        return {
          backgroundColor: backgroundColor || theme.colors.card,
          borderRadius: borderRadius ?? theme.spacing.sm,
          ...(shadow ? Shadows.medium : {}),
        };
      case 'flat':
        return {
          backgroundColor: backgroundColor || theme.colors.card,
          borderRadius: borderRadius ?? theme.spacing.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      default: // default
        return {
          backgroundColor: backgroundColor || theme.colors.card,
          borderRadius: borderRadius ?? theme.spacing.sm,
          ...(shadow ? Shadows.small : {}),
        };
    }
  };

  // 패딩 값 계산
  const getPaddingValue = (): number => {
    if (typeof padding === 'number') {
      return padding;
    }
    if (padding && typeof padding === 'string') {
      return theme.spacing[padding] || 0;
    }
    
    // 변형별 기본 패딩
    switch (variant) {
      case 'post':
        return theme.spacing.md;
      default:
        return theme.spacing.lg;
    }
  };

  // 마진 값 계산
  const getMarginValue = (): number => {
    if (typeof margin === 'number') {
      return margin;
    }
    if (margin && typeof margin === 'string') {
      return theme.spacing[margin] || 0;
    }
    
    // 변형별 기본 마진
    switch (variant) {
      case 'post':
        return theme.spacing.md;
      default:
        return 0;
    }
  };

  const cardStyle: ViewStyle = {
    ...getVariantStyle(),
    padding: getPaddingValue(),
    margin: getMarginValue(),
  };

  const combinedStyle = [cardStyle, style];

  return (
    <View style={combinedStyle} {...props}>
      {children}
    </View>
  );
};

// 특수한 카드 컴포넌트들
export const PostCard: React.FC<Omit<StyledCardProps, 'variant'>> = (props) => (
  <StyledCard variant="post" {...props} />
);

export const ElevatedCard: React.FC<Omit<StyledCardProps, 'variant'>> = (props) => (
  <StyledCard variant="elevated" {...props} />
);

export const FlatCard: React.FC<Omit<StyledCardProps, 'variant'>> = (props) => (
  <StyledCard variant="flat" {...props} />
);