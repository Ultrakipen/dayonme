// 🔥 캐시 및 성능 최적화 상수
export const CACHE_CONFIG = {
  PROFILE_DATA: 5 * 60 * 1000, // 5분
  USER_STATS: 3 * 60 * 1000, // 3분
  IMAGE: 30 * 60 * 1000, // 30분
} as const;

// 🔥 API 재시도 설정
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// 🔥 이미지 최적화 설정
export const IMAGE_CONFIG = {
  PROFILE: {
    MAX_WIDTH: 400,
    MAX_HEIGHT: 400,
    QUALITY: 0.75,
    FORMAT: 'webp' as const,
  },
  POST: {
    MAX_WIDTH: 1200,
    MAX_HEIGHT: 1200,
    QUALITY: 0.8,
    FORMAT: 'webp' as const,
  },
  THUMBNAIL: {
    SMALL: { width: 80, height: 80 },
    MEDIUM: { width: 120, height: 120 },
    LARGE: { width: 160, height: 160 },
    XLARGE: { width: 240, height: 240 },
  },
} as const;

// 🔥 페이지네이션 설정
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// 🔥 입력 검증 설정
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100,
  },
  BIO: {
    MAX_LENGTH: 200,
  },
  POST: {
    MAX_LENGTH: 2000,
  },
} as const;

// 🔥 사용자 증가 대비 성능 설정
export const PERFORMANCE = {
  MAX_CONSECUTIVE_DAYS: 30,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
} as const;
