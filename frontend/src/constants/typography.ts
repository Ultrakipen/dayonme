// constants/typography.ts
// 표준화된 타이포그래피 시스템 (인스타그램 스타일 + 2026 모바일 트렌드)
// React Native 0.80 호환성: lazy initialization
import { normalizeFont, moderateScale } from './responsive';

// 초기화 플래그
let _initialized = false;

// 실제 값들을 저장할 객체
const _values: any = {
  FONT_SIZES: {},
  TEXT_STYLES: {},
};

/**
 * 타이포그래피 값을 초기화하는 함수
 */
export const initializeTypography = () => {
  if (_initialized) return;

  // FONT_SIZES 초기화 (인스타그램 스타일)
  Object.assign(_values.FONT_SIZES, {
    h1: normalizeFont(24),
    h2: normalizeFont(20),
    h3: normalizeFont(18),
    h4: normalizeFont(17),
    body: normalizeFont(15),
    bodyLarge: normalizeFont(16),
    bodySmall: normalizeFont(14),
    caption: normalizeFont(13),
    small: normalizeFont(12),
    tiny: normalizeFont(11),
    button: normalizeFont(15),
    buttonSmall: normalizeFont(14),
    input: normalizeFont(15),
    placeholder: normalizeFont(14),
  });

  // TEXT_STYLES 초기화
  const fontSizes = _values.FONT_SIZES;
  Object.assign(_values.TEXT_STYLES, {
    h1: {
      fontSize: fontSizes.h1,
      fontWeight: FONT_WEIGHTS.bold,
      lineHeight: fontSizes.h1 * LINE_HEIGHTS.tight,
    },
    h2: {
      fontSize: fontSizes.h2,
      fontWeight: FONT_WEIGHTS.bold,
      lineHeight: fontSizes.h2 * LINE_HEIGHTS.tight,
    },
    h3: {
      fontSize: fontSizes.h3,
      fontWeight: FONT_WEIGHTS.semiBold,
      lineHeight: fontSizes.h3 * LINE_HEIGHTS.normal,
    },
    body: {
      fontSize: fontSizes.body,
      fontWeight: FONT_WEIGHTS.regular,
      lineHeight: fontSizes.body * LINE_HEIGHTS.normal,
    },
    bodyBold: {
      fontSize: fontSizes.body,
      fontWeight: FONT_WEIGHTS.semiBold,
      lineHeight: fontSizes.body * LINE_HEIGHTS.normal,
    },
    caption: {
      fontSize: fontSizes.caption,
      fontWeight: FONT_WEIGHTS.regular,
      lineHeight: fontSizes.caption * LINE_HEIGHTS.normal,
    },
    captionBold: {
      fontSize: fontSizes.caption,
      fontWeight: FONT_WEIGHTS.semiBold,
      lineHeight: fontSizes.caption * LINE_HEIGHTS.normal,
    },
    button: {
      fontSize: fontSizes.button,
      fontWeight: FONT_WEIGHTS.semiBold,
      lineHeight: fontSizes.button * LINE_HEIGHTS.tight,
    },
  });

  _initialized = true;
};

// Export할 객체들 (빈 객체로 시작)
export const FONT_SIZES = _values.FONT_SIZES;
export const TEXT_STYLES = _values.TEXT_STYLES;

/**
 * 폰트 두께 (Weight)
 */
export const FONT_WEIGHTS = {
  thin: '100' as const,
  extraLight: '200' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

/**
 * 라인 높이 (Line Height) - 한글 최적화
 */
export const LINE_HEIGHTS = {
  tight: 1.3,
  normal: 1.5,
  relaxed: 1.6,
  loose: 1.8,
};

/**
 * 자간 (Letter Spacing) - 한글 최적화
 */
export const LETTER_SPACING = {
  tight: -0.3,
  normal: -0.1,
  wide: 0,
  wider: 0.2,
};

/**
 * 안전한 폰트 크기 생성 (최소값 보장)
 * @param size 원하는 폰트 크기
 * @param minSize 최소 폰트 크기 (기본 12)
 */
export const safeFontSize = (size: number, minSize = 12): number => {
  return Math.max(minSize, moderateScale(size));
};
