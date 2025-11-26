/**
 * 🎨 통합 디자인 시스템
 * 2025-2026 모바일 앱 트렌드 반영
 * 인스타그램 스타일 기반
 */

// ===== 색상 팔레트 =====
export const COLORS = {
  // Primary Colors - 통일된 브랜드 컬러
  primary: '#667EEA',
  primaryLight: '#8B9FFF',
  primaryDark: '#5568D3',

  secondary: '#764BA2',
  secondaryLight: '#9B6BC7',
  secondaryDark: '#5A3880',

  // Accent Colors
  accent: '#FF6B9D',
  accentLight: '#FF8FB5',
  accentDark: '#E64E82',

  // Status Colors
  success: '#00B894',
  successLight: '#00D9A8',
  successDark: '#009B7D',

  warning: '#FDCB6E',
  warningLight: '#FFE066',
  warningDark: '#E5B65E',

  danger: '#E17055',
  dangerLight: '#FF8A73',
  dangerDark: '#C85A42',

  info: '#74B9FF',
  infoLight: '#92CBFF',
  infoDark: '#5AA3E6',

  // Background Colors
  background: '#FAFBFC',
  darkBackground: '#0D0D1E',

  // Surface Colors
  surface: '#FFFFFF',
  darkSurface: '#1A1D29',
  surfaceVariant: '#F7F7F7',
  darkSurfaceVariant: '#2a2a2a',

  // Text Colors - WCAG AA 준수
  text: '#1E293B',
  darkText: '#F8FAFC',
  textSecondary: '#5B5B5B',
  darkTextSecondary: '#B3B3B3',
  textTertiary: '#94A3B8',
  darkTextTertiary: '#64748B',
  textDisabled: '#CBD5E0',
  darkTextDisabled: '#475569',

  // Border & Divider
  border: '#E2E8F0',
  darkBorder: '#404040',
  separator: '#F1F5F9',
  darkSeparator: '#334155',

  // Glass Effect (Glassmorphism)
  glass: 'rgba(255, 255, 255, 0.15)',
  darkGlass: 'rgba(15, 15, 30, 0.4)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  darkGlassBorder: 'rgba(255, 255, 255, 0.1)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  darkOverlay: 'rgba(0, 0, 0, 0.7)',

  // Shadow Colors
  shadowColor: 'rgba(99, 102, 241, 0.35)',
  darkShadowColor: 'rgba(15, 15, 30, 0.5)',

  // Gradient Colors (for backward compatibility)
  gradientStart: '#667EEA',
  gradientEnd: '#764BA2',
  // Gradient Arrays - MyChallengesScreen에서 사용
  gradientHarmony: ['#667EEA', '#764BA2'],
  gradientWarm: ['#FA709A', '#FEE140'],
  gradientCool: ['#4FACFE', '#00F2FE'],
  gradientNature: ['#43E97B', '#38F9D7'],
};

// ===== 그라디언트 =====
export const GRADIENTS = {
  primary: ['#667EEA', '#764BA2'],
  secondary: ['#F093FB', '#F5576C'],
  success: ['#00B894', '#00D9A8'],
  danger: ['#E17055', '#FF8A73'],
  sunset: ['#FF9A9E', '#FECFEF'],
  ocean: ['#4FACFE', '#00F2FE'],
  forest: ['#43E97B', '#38F9D7'],
  lavender: ['#A8EDEA', '#FED6E3'],
};

// 챌린지별 그라디언트 팔레트
export const GRADIENT_PALETTES = [
  ['#667EEA', '#764BA2'], // 보라-핑크
  ['#F093FB', '#F5576C'], // 핑크-레드
  ['#4FACFE', '#00F2FE'], // 파랑-하늘
  ['#43E97B', '#38F9D7'], // 초록-민트
  ['#FA709A', '#FEE140'], // 핑크-노랑
  ['#30CFD0', '#330867'], // 민트-보라
  ['#A8EDEA', '#FED6E3'], // 민트-핑크
  ['#FF9A9E', '#FECFEF'], // 코랄-핑크
  ['#FFECD2', '#FCB69F'], // 피치-오렌지
  ['#C471F5', '#FA71CD'], // 보라-핑크
  ['#48C6EF', '#6F86D6'], // 하늘-보라
  ['#FEAC5E', '#C779D0'], // 오렌지-보라
];

export const getGradientColors = (challengeId: number): string[] => {
  const index = challengeId % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
};

// ===== 타이포그래피 =====
export const TYPOGRAPHY = {
  // Headings
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },

  // Body Text
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Supporting Text
  subtitle1: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  overline: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },

  // Button Text
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
};

// ===== 간격 (Spacing) =====
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Component Specific
  cardPadding: 16,
  cardGap: 12,
  sectionGap: 24,
  containerPadding: 16,

  // Touch Targets (최소 44x44)
  touchMin: 44,
  iconButton: 40,
};

// ===== 라운드 (Border Radius) =====
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,

  // Component Specific
  card: 16,
  button: 12,
  input: 12,
  modal: 20,
};

// ===== 그림자 (Shadows) =====
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ===== 애니메이션 =====
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: 'ease-in-out',
    spring: 'spring',
  },
};

// ===== 레이아웃 =====
export const LAYOUT = {
  screenPadding: 16,
  maxWidth: 600,
  headerHeight: 56,
  tabBarHeight: 60,
  bottomSheetMaxHeight: '90%',
};

// ===== 유틸리티 함수 =====
export const getColor = (isDarkMode: boolean, lightColor: string, darkColor: string) => {
  return isDarkMode ? darkColor : lightColor;
};

export const getThemedColors = (isDarkMode: boolean) => ({
  background: isDarkMode ? COLORS.darkBackground : COLORS.background,
  surface: isDarkMode ? COLORS.darkSurface : COLORS.surface,
  text: isDarkMode ? COLORS.darkText : COLORS.text,
  textSecondary: isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary,
  border: isDarkMode ? COLORS.darkBorder : COLORS.border,
});
