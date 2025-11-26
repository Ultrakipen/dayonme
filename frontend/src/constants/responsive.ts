// constants/responsive.ts
// Galaxy S25 기준 (1080 x 2340, FHD+) 표준화된 반응형 스케일링
// React Native 0.80 + Hermes 호환성: 초기화 전 Dimensions 접근 방지
import { Dimensions } from 'react-native';

// Galaxy S25 기준 해상도
export const BASE_WIDTH = 393; // 논리적 너비 (1080px / 2.75 density)
export const BASE_HEIGHT = 851; // 논리적 높이 (2340px / 2.75 density)

// 초기화 완료 플래그
let _dimensionsInitialized = false;
let _cachedWidth = BASE_WIDTH;
let _cachedHeight = BASE_HEIGHT;

// React Native 0.80 호환성: 초기화 후에만 Dimensions.get() 호출
const _getWindowDimensions = () => {
  // 초기화 전에는 기본값 반환 (Hermes 오류 방지)
  if (!_dimensionsInitialized) {
    return { width: _cachedWidth, height: _cachedHeight };
  }
  return { width: _cachedWidth, height: _cachedHeight };
};

/**
 * 너비 기반 스케일링
 * @param size 기준 사이즈
 * @returns 현재 화면에 맞게 조정된 사이즈
 */
export const scale = (size: number): number => {
  const { width: SCREEN_WIDTH } = _getWindowDimensions();
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  // 최소 0.85배, 최대 1.3배로 제한하여 극단적인 크기 방지
  const clampedScale = Math.max(0.85, Math.min(1.3, scaleFactor));
  return size * clampedScale;
};

/**
 * 높이 기반 스케일링
 * @param size 기준 사이즈
 * @returns 현재 화면에 맞게 조정된 사이즈
 */
export const verticalScale = (size: number): number => {
  const { height: SCREEN_HEIGHT } = _getWindowDimensions();
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  const clampedScale = Math.max(0.85, Math.min(1.3, scaleFactor));
  return size * clampedScale;
};

/**
 * 중간 스케일링 (너비와 높이의 평균적 적용)
 * @param size 기준 사이즈
 * @param factor 스케일링 강도 (0~1, 기본 0.5)
 * @returns 현재 화면에 맞게 조정된 사이즈
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * 폰트 크기 정규화 (최소 12px 보장)
 * @param size 기준 폰트 크기
 * @returns 최소값이 적용된 폰트 크기
 */
export const normalizeFont = (size: number): number => {
  const scaled = moderateScale(size);
  return Math.max(12, scaled); // 최소 12px 보장
};

// 화면 크기 정보 (React Native 0.80 호환성: lazy 초기화)
let _screenDimensions: {
  width: number;
  height: number;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isLargeDevice: boolean;
} = {
  width: 393,  // 기본값
  height: 851,
  isSmallDevice: false,
  isMediumDevice: true,
  isLargeDevice: false,
};

export const getScreenDimensions = () => {
  return _screenDimensions;
};

export const initializeScreenDimensions = () => {
  try {
    const { width, height } = Dimensions.get('window');
    if (width > 0 && height > 0) {
      // 캐시된 값 업데이트
      _cachedWidth = width;
      _cachedHeight = height;
      _dimensionsInitialized = true;

      _screenDimensions = {
        width,
        height,
        isSmallDevice: width < 375,
        isMediumDevice: width >= 375 && width < 414,
        isLargeDevice: width >= 414,
      };
    }
  } catch (e) {
    // 런타임이 아직 준비되지 않음 - 기본값 유지
  }
};

// Getter 객체로 export (모듈 레벨 접근 방지)
export const SCREEN_DIMENSIONS = {
  get width() {
    return getScreenDimensions().width;
  },
  get height() {
    return getScreenDimensions().height;
  },
  get isSmallDevice() {
    return getScreenDimensions().isSmallDevice;
  },
  get isMediumDevice() {
    return getScreenDimensions().isMediumDevice;
  },
  get isLargeDevice() {
    return getScreenDimensions().isLargeDevice;
  },
};
