// 표준화된 타이포그래피 시스템
// React Native 0.80 호환성: lazy initialization
import { Dimensions, PixelRatio } from 'react-native';

const BASE_WIDTH = 360;
const BASE_HEIGHT = 800;

// Lazy 초기화: 런타임에 계산 (초기화 함수 호출 후에만 사용)
let _scale: number = 1; // 기본값으로 시작
let _initialized = false;

const calculateScale = () => {
  try {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
    if (SCREEN_WIDTH > 0 && SCREEN_HEIGHT > 0) {
      const widthScale = SCREEN_WIDTH / BASE_WIDTH;
      const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;
      return Math.min(Math.max(Math.min(widthScale, heightScale), 0.85), 1.15);
    }
  } catch (e) {
    // 런타임이 아직 준비되지 않음
  }
  return 1; // 기본값
};

// 반응형 폰트 크기 계산 (lazy)
export const scaleFontSize = (size: number) => Math.round(size * _scale);
export const scaleSpacing = (size: number) => Math.round(size * _scale);

// WCAG AA 준수 타이포그래피 - 초기화 버전
const _typographyCache: any = {
  // 기본값으로 시작
  h1: 20,
  h2: 18,
  h3: 16,
  body: 15,
  bodySmall: 14,
  caption: 13,
  captionSmall: 13,
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

// 초기 객체로 export
export const TYPOGRAPHY: any = _typographyCache;

// 초기화 함수 - App mount 후 호출됨
export const initializeUtilsTypography = () => {
  if (_initialized) return;

  // scale 계산
  _scale = calculateScale();

  // Typography 값 업데이트
  _typographyCache.h1 = scaleFontSize(20);
  _typographyCache.h2 = scaleFontSize(18);
  _typographyCache.h3 = scaleFontSize(16);
  _typographyCache.body = scaleFontSize(15);
  _typographyCache.bodySmall = scaleFontSize(14);
  _typographyCache.caption = scaleFontSize(13);
  _typographyCache.captionSmall = scaleFontSize(13);

  // MIN_TOUCH_SIZE 초기화
  MIN_TOUCH_SIZE_VALUE = scaleSpacing(44);

  _initialized = true;
};

// WCAG AA 준수 색상 (대비율 4.5:1 이상)
export const ACCESSIBLE_COLORS = {
  textPrimary: '#1F2937',     // ~15:1
  textSecondary: '#374151',   // ~10:1
  textTertiary: '#4B5563',    // ~7:1
  textDisabled: '#6B7280',    // ~4.6:1
  textPrimaryVariant: '#1E293B', // 약간 더 어두운 텍스트

  // 기존 보라색 계열 유지
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',

  // 배경
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F8FAFC',
  border: '#E2E8F0',

  // 시스템 색상
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',

  // 특수 효과
  shadow: '#0F172A',
  glassmorphism: 'rgba(255, 255, 255, 0.25)',

  // 그라디언트
  gradientStart: '#667EEA',
  gradientEnd: '#764BA2',

  // 보조 색상
  secondary: '#EC4899',
};

// 터치 타겟 최소 크기 (접근성)
let MIN_TOUCH_SIZE_VALUE: number = 44; // 기본값
export const getMinTouchSize = () => {
  return MIN_TOUCH_SIZE_VALUE;
};

export const MIN_TOUCH_SIZE = 44; // 기본값
