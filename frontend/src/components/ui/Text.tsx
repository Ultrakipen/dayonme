// src/components/ui/Text.tsx
import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { useModernTheme } from '../../contexts/ModernThemeContext';

const textStyle = tva({
  base: 'text-base',
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    size: 'md',
    weight: 'normal',
  },
});

interface TextProps extends RNTextProps {
  children?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

export const Text: React.FC<TextProps> = ({
  children,
  size = 'md',
  weight = 'normal',
  className,
  style,
  ...props
}) => {
  const { theme, isDark } = useModernTheme();

  // 명시적 색상이 없으면 다크모드에 따라 기본 색상 설정
  const defaultColor = isDark ? '#FFFFFF' : '#1A1A1A';

  // className을 사용하지 않고 순수 style만 사용 (다크모드 지원)
  return (
    <RNText
      style={[{ color: defaultColor }, style]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Text;