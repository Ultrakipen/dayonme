// theme/typography.ts - 모던 스타일 타이포그래피 시스템
import { Platform } from 'react-native';

export const Typography = {
  // Font Families (시스템 폰트 사용)
  fontFamily: {
    primary: Platform.select({
      ios: 'San Francisco',
      android: 'Roboto',
      default: 'System',
    }),
    secondary: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto',
      default: 'System',
    }),
    mono: Platform.select({
      ios: 'Menlo',
      android: 'Roboto Mono',
      default: 'monospace',
    }),
  },
  
  // Font Weights
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  
  // Font Sizes (모던 스케일 - 가독성 개선)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 26,
    '4xl': 30,
    '5xl': 34,
    '6xl': 38,
  },
  
  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Text Styles (Instagram-specific)
  textStyles: {
    // Headers
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 32,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    
    // Body Text (가독성 개선)
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    bodyLarge: {
      fontSize: 17,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 17,
    },
    
    // Labels
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 18,
    },
    labelSmall: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
    
    // Captions
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    captionSmall: {
      fontSize: 10,
      fontWeight: '400' as const,
      lineHeight: 14,
    },
    
    // Buttons
    button: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 18,
    },
    buttonLarge: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    buttonSmall: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
    
    // App-specific styles
    username: {
      fontSize: 15,
      fontWeight: '600' as const,
      lineHeight: 19,
    },
    postText: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 21,
    },
    hashtag: {
      fontSize: 15,
      fontWeight: '500' as const,
      lineHeight: 19,
      color: '#0ea5e9', // App blue
    },
    mention: {
      fontSize: 15,
      fontWeight: '600' as const,
      lineHeight: 19,
      color: '#0ea5e9', // App blue
    },
    timestamp: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 17,
      color: '#9ca3af', // App gray
    },
  },
};

export const createTextStyle = (
  size: keyof typeof Typography.fontSize,
  weight: keyof typeof Typography.fontWeight,
  lineHeight?: keyof typeof Typography.lineHeight
) => ({
  fontSize: Typography.fontSize[size],
  fontWeight: Typography.fontWeight[weight],
  lineHeight: lineHeight ? Typography.fontSize[size] * Typography.lineHeight[lineHeight] : undefined,
  fontFamily: Typography.fontFamily.primary,
});