// 2026 트렌드 디자인 시스템 - 챌린지 페이지 최적화
// 인스타그램 스타일 + 95점 수준 완성도

// Typography Scale (8pt 그리드 기반, 접근성 준수)
export const TYPOGRAPHY = {
  // Display - 헤더, 중요 숫자
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },

  // Headline - 페이지 제목, 카드 제목
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },

  // Body - 본문 (인스타그램 기본 17px)
  body1: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  body2: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },

  // Label - 버튼, 라벨
  label1: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  label2: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },

  // Caption - 보조 정보 (최소 13px)
  caption1: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  caption2: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
};

// Spacing (8pt 그리드)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border Radius (2026 트렌드: 더 부드럽게)
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// 2025-2026 트렌드 컬러 팔레트
export const COLORS = {
  // Primary
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5F3DC4',

  // Secondary
  secondary: '#EC4899',
  secondaryLight: '#FD79A8',
  secondaryDark: '#DB2777',

  // Accent
  accent: '#10B981',
  accentLight: '#34D399',
  accentDark: '#059669',

  // Semantic
  success: '#00B894',
  warning: '#FDCB6E',
  danger: '#E17055',
  info: '#0EA5E9',

  // Background
  background: '#F8F9FF',
  darkBackground: '#0D0D1E',

  // Surface
  surface: '#FFFFFF',
  darkSurface: '#1A1D29',
  surfaceVariant: '#F8FAFC',
  darkSurfaceVariant: '#2C2F3D',

  // Text
  text: '#1E293B',
  darkText: '#F8FAFC',
  textSecondary: '#64748B',
  darkTextSecondary: '#94A3B8',
  textTertiary: '#94A3B8',
  darkTextTertiary: '#64748B',

  // Border
  border: '#E2E8F0',
  darkBorder: '#334155',
  borderLight: '#F1F5F9',
  darkBorderLight: '#1E293B',

  // Glass Effect (2026 트렌드)
  glass: 'rgba(255, 255, 255, 0.7)',
  darkGlass: 'rgba(26, 29, 41, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  darkGlassBorder: 'rgba(255, 255, 255, 0.1)',

  // Gradient
  gradientStart: '#667EEA',
  gradientEnd: '#764BA2',

  // Shadow
  shadowColor: '#6C5CE7',
  shadowColorDark: '#000000',
};

// Shadow Styles (iOS/Android 대응, 2026 트렌드: 부드럽고 깊은 그림자)
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
};

// 다크모드 그림자
export const DARK_SHADOWS = {
  none: SHADOWS.none,
  sm: {
    shadowColor: COLORS.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadowColorDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadowColorDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: COLORS.shadowColorDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
};

// 터치 영역 최소값 (접근성)
export const TOUCH_TARGET = {
  minSize: 44, // iOS HIG 기준
  iconSize: 24,
  iconButtonSize: 40,
};

// 카드 스타일 (인스타그램 + 2026 트렌드)
export const CARD_STYLES = {
  default: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    ...SHADOWS.md,
  },
  glass: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.lg,
  },
};

// 애니메이션 Duration (자연스러운 움직임)
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// 그라디언트 팔레트 (챌린지 ID별 색상)
export const GRADIENT_PALETTES = [
  ['#667EEA', '#764BA2'],
  ['#F093FB', '#F5576C'],
  ['#4FACFE', '#00F2FE'],
  ['#43E97B', '#38F9D7'],
  ['#FA709A', '#FEE140'],
  ['#30CFD0', '#330867'],
  ['#A8EDEA', '#FED6E3'],
  ['#FF9A9E', '#FECFEF'],
  ['#FFECD2', '#FCB69F'],
  ['#C471F5', '#FA71CD'],
  ['#48C6EF', '#6F86D6'],
  ['#FEAC5E', '#C779D0'],
];

export const getGradientColors = (id: number): string[] => {
  return GRADIENT_PALETTES[id % GRADIENT_PALETTES.length];
};
