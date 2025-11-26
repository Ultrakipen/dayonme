// 시맨틱 색상 상수 - HomeScreen 및 전체 앱에서 사용
// 다크모드/라이트모드 대응 색상 정의

export const SEMANTIC_COLORS = {
  // 브랜드 색상
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',

  // 보조 색상
  secondary: '#6B7280',
  secondaryLight: '#9CA3AF',
  secondaryDark: '#4B5563',

  // 상태 색상
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#0EA5E9',
  infoLight: '#38BDF8',

  // 보라색 계열 (브랜드 악센트)
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#7C3AED',

  // 중립 색상
  shadow: '#000000',
  white: '#FFFFFF',

  // 테두리
  border: '#E5E7EB',
  borderLight: '#F1F5F9',
  borderDark: '#374151',
} as const;

// 다크모드 전용 색상
export const DARK_COLORS = {
  background: '#0D0D0D',
  backgroundSecondary: '#1A1A1A',
  card: '#1E1E1E',
  cardHover: '#2D2D2D',
  surface: '#1F2937',
  surfaceHover: '#374151',

  // 보라색 계열 (다크모드)
  purple: '#4C1D95',
  purpleLight: '#5B21B6',
  purpleAccent: '#A78BFA',

  // 텍스트
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',

  // 하이라이트
  highlight: 'rgba(139, 92, 246, 0.15)',
  highlightBorder: '#A78BFA',
} as const;

// 라이트모드 전용 색상
export const LIGHT_COLORS = {
  background: '#F8F8F8',
  backgroundSecondary: '#FFFFFF',
  card: '#FEFEFE',
  cardHover: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceHover: '#F3F4F6',

  // 보라색 계열 (라이트모드)
  purple: '#F3E8FF',
  purpleLight: '#EDE9FE',
  purpleAccent: '#8B5CF6',

  // 텍스트
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // 하이라이트
  highlight: '#F3E8FF',
  highlightBorder: '#8B5CF6',
} as const;

// 그림자 설정
export const SHADOW_STYLES = {
  small: {
    shadowColor: SEMANTIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  medium: {
    shadowColor: SEMANTIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  large: {
    shadowColor: SEMANTIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// 투명도 색상 헬퍼
export const withAlpha = (hex: string, alpha: number): string => {
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${alphaHex}`;
};

// 타입 내보내기
export type SemanticColorKey = keyof typeof SEMANTIC_COLORS;
export type DarkColorKey = keyof typeof DARK_COLORS;
export type LightColorKey = keyof typeof LIGHT_COLORS;
