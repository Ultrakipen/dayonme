/**
 * 앱 전역 상수
 */

// 타이밍 상수
export const TIMING = {
  DEBOUNCE_MS: 300,
  ANIMATION_DURATION: 500,
  HAPTIC_DELAY: 50,
  SCROLL_THRESHOLD: 300,
  CACHE_DURATION: 300000, // 5분
};

// 크기 상수
export const SIZES = {
  MIN_FONT_SIZE: 14,
  MAX_INPUT_LENGTH: 500,
  MAX_COMMENT_LENGTH: 500,
  MAX_TITLE_LENGTH: 100,
  IMAGE_QUALITY: 0.8,
  CARD_SPACING: 8,
  SECTION_SPACING: 16,
};

// 접근성
export const A11Y = {
  MIN_TOUCH_SIZE: 44,
  MIN_CONTRAST_RATIO: 4.5,
};

export default {
  TIMING,
  SIZES,
  A11Y,
};
