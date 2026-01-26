// 챌린지 디자인 시스템 - 2026 트렌드 최적화 (반응형)
// React Native 0.80 호환성: lazy initialization
import { normalize } from '../utils/responsive';

// 기본값 (런타임 전)
const DEFAULT_TYPOGRAPHY = {
  h1: { fontSize: 18, fontFamily: 'Pretendard-Bold' as const, lineHeight: 25 },
  h2: { fontSize: 16, fontFamily: 'Pretendard-Bold' as const, lineHeight: 23 },
  h3: { fontSize: 15, fontFamily: 'Pretendard-SemiBold' as const, lineHeight: 21 },
  h4: { fontSize: 14, fontFamily: 'Pretendard-SemiBold' as const, lineHeight: 19 },
  body1: { fontSize: 13, fontFamily: 'Pretendard-Regular' as const, lineHeight: 19 },
  body2: { fontSize: 12, fontFamily: 'Pretendard-Regular' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontFamily: 'Pretendard-Medium' as const, lineHeight: 16 },
  subtitle: { fontSize: 11, fontFamily: 'Pretendard-Regular' as const, lineHeight: 16 },
  tiny: { fontSize: 10, fontFamily: 'Pretendard-Medium' as const, lineHeight: 14 },
};

const DEFAULT_SPACING = {
  xs: 8,
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 36,
  cardGap: 20,
  cardPadding: 20,
  sectionGap: 28,
  touchMin: 48,
  iconButton: 44,
};

const DEFAULT_RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  round: 999,
};

// Lazy 초기화된 값 캐시
let _typographyCache: typeof DEFAULT_TYPOGRAPHY | null = null;
let _spacingCache: typeof DEFAULT_SPACING | null = null;
let _radiusCache: typeof DEFAULT_RADIUS | null = null;

// Getter 함수들
export const getTypography = () => {
  if (!_typographyCache) {
    _typographyCache = {
      h1: { fontSize: normalize(18), fontFamily: 'Pretendard-Bold' as const, lineHeight: normalize(25) },
      h2: { fontSize: normalize(16), fontFamily: 'Pretendard-Bold' as const, lineHeight: normalize(23) },
      h3: { fontSize: normalize(15), fontFamily: 'Pretendard-SemiBold' as const, lineHeight: normalize(21) },
      h4: { fontSize: normalize(14), fontFamily: 'Pretendard-SemiBold' as const, lineHeight: normalize(19) },
      body1: { fontSize: normalize(13), fontFamily: 'Pretendard-Regular' as const, lineHeight: normalize(19) },
      body2: { fontSize: normalize(12), fontFamily: 'Pretendard-Regular' as const, lineHeight: normalize(18) },
      caption: { fontSize: normalize(11), fontFamily: 'Pretendard-Medium' as const, lineHeight: normalize(16) },
      subtitle: { fontSize: normalize(11), fontFamily: 'Pretendard-Regular' as const, lineHeight: normalize(16) },
      tiny: { fontSize: normalize(10), fontFamily: 'Pretendard-Medium' as const, lineHeight: normalize(14) },
    };
  }
  return _typographyCache;
};

export const getSpacing = () => {
  if (!_spacingCache) {
    _spacingCache = {
      xs: normalize(8),
      sm: normalize(14),
      md: normalize(18),
      lg: normalize(22),
      xl: normalize(28),
      xxl: normalize(36),
      cardGap: normalize(20),
      cardPadding: normalize(20),
      sectionGap: normalize(28),
      touchMin: normalize(48),
      iconButton: normalize(44),
    };
  }
  return _spacingCache;
};

export const getRadius = () => {
  if (!_radiusCache) {
    _radiusCache = {
      sm: normalize(12),
      md: normalize(16),
      lg: normalize(20),
      xl: normalize(24),
      round: 999,
    };
  }
  return _radiusCache;
};

// 하위 호환성을 위한 export (기본값 사용)
export const TYPOGRAPHY = DEFAULT_TYPOGRAPHY;
export const SPACING = DEFAULT_SPACING;
export const RADIUS = DEFAULT_RADIUS;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
};
