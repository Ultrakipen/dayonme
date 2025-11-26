// src/utils/responsive.ts - 넓은 범위의 모바일 해상도 대응 (2024-2026)
// React Native 0.80 호환성: lazy initialization
import { Dimensions, PixelRatio } from 'react-native';

// 화면 크기 카테고리 타입 (먼저 정의)
export type ScreenCategory = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

// 기준 디자인 크기 (갤럭시 S25 FHD+ 기준)
const DESIGN_WIDTH = 360;   // 갤럭시 S25 기준
const DESIGN_HEIGHT = 780;  // FHD+ 비율 (2340px / 3.0)

// 넓은 범위의 모바일 기기 대응 BREAKPOINTS
export const BREAKPOINTS = {
  XS: 320,   // 초소형 (아이폰 SE, 구형 안드로이드)
  SM: 360,   // 소형 (갤럭시 S25, 갤럭시 A 시리즈) ← 기준점
  MD: 390,   // 중형 (아이폰 14/15)
  LG: 412,   // 대형 (갤럭시 S25+, Pixel)
  XL: 480,   // 초대형 (갤럭시 S25 Ultra, 폴더블)
  XXL: 600,  // 태블릿
} as const;

// 모든 상태를 클로저 안에 캡슐화 (Hermes TDZ 오류 방지)
const _state = {
  initialized: false,
  screenWidth: 360,
  screenHeight: 780,
  scale: 1,
  screenCategory: 'sm' as ScreenCategory,
  scaleMultiplier: 1,
};

// 화면 크기 카테고리 판별
const getScreenCategory = (width: number): ScreenCategory => {
  if (width <= BREAKPOINTS.XS) return 'xs';
  if (width <= BREAKPOINTS.SM) return 'sm';
  if (width <= BREAKPOINTS.MD) return 'md';
  if (width <= BREAKPOINTS.LG) return 'lg';
  if (width < BREAKPOINTS.XXL) return 'xl';
  return 'xxl';
};

// 화면 크기별 스케일 조정 계수
const getScaleMultiplier = (category: ScreenCategory): number => {
  switch (category) {
    case 'xs': return 0.88;
    case 'sm': return 1.00;
    case 'md': return 1.05;
    case 'lg': return 1.08;
    case 'xl': return 1.12;
    case 'xxl': return 1.20;
    default: return 1.00;
  }
};

const initializeScreenDimensions = () => {
  if (!_state.initialized) {
    try {
      const { width, height } = Dimensions.get('window');
      if (width > 0 && height > 0) {
        _state.screenWidth = width;
        _state.screenHeight = height;

        const widthScale = _state.screenWidth / DESIGN_WIDTH;
        const heightScale = _state.screenHeight / DESIGN_HEIGHT;
        _state.scale = Math.min(widthScale, heightScale);

        _state.screenCategory = getScreenCategory(_state.screenWidth);
        _state.scaleMultiplier = getScaleMultiplier(_state.screenCategory);
        _state.initialized = true;
      }
    } catch (e) {
      // 런타임이 아직 준비되지 않음 - 기본값 사용
    }
  }
};

/**
 * 반응형 폰트 크기 계산 (기본)
 */
export const RFValue = (fontSize: number, baseWidth = DESIGN_WIDTH): number => {
  initializeScreenDimensions();
  if (!_state.initialized) return Math.round(fontSize);
  const newSize = fontSize * (_state.screenWidth / baseWidth) * _state.scaleMultiplier;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * 화면 너비 퍼센트 기준
 */
export const wp = (percentage: number): number => {
  initializeScreenDimensions();
  if (!_state.initialized) return (360 * percentage) / 100;
  return (_state.screenWidth * percentage) / 100;
};

/**
 * 화면 높이 퍼센트 기준
 */
export const hp = (percentage: number): number => {
  initializeScreenDimensions();
  if (!_state.initialized) return (780 * percentage) / 100;
  return (_state.screenHeight * percentage) / 100;
};

/**
 * 반응형 폰트 정규화 (최소/최대값 제한 포함)
 * 갤럭시 S25 기준으로 모든 기기에서 가독성 보장
 */
export const normalize = (size: number, minSize?: number, maxSize?: number): number => {
  initializeScreenDimensions();

  // 초기화 전에는 기본값 반환
  if (!_state.initialized) {
    const result = size;
    if (minSize && result < minSize) return Math.round(minSize);
    if (maxSize && result > maxSize) return Math.round(maxSize);
    return Math.round(result);
  }

  let newSize = size * _state.scale * _state.scaleMultiplier;

  // 화면 크기별 세밀한 조정 (가독성 최적화)
  if (_state.screenCategory === 'xs') {
    // 아이폰 SE 등 초소형: 최소 크기 보장
    newSize = Math.max(size * 0.86, newSize);
  } else if (_state.screenCategory === 'sm') {
    // 갤럭시 S25: 기준 크기 유지
    newSize = size * _state.scaleMultiplier;
  } else if (_state.screenCategory === 'md') {
    // 아이폰 14/15: 약간 증가
    newSize = size * 1.02 * _state.scaleMultiplier;
  } else if (_state.screenCategory === 'xxl') {
    // 태블릿: 최대 크기 제한
    newSize = Math.min(size * 1.25, newSize);
  }

  if (minSize && newSize < minSize) return Math.round(minSize);
  if (maxSize && newSize > maxSize) return Math.round(maxSize);

  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * 이모지/아이콘 크기 정규화
 */
export const normalizeIcon = (size: number): number => {
  initializeScreenDimensions();
  if (!_state.initialized) return Math.round(size);
  const baseSize = normalize(size);
  const multiplier = _state.screenCategory === 'xs' ? 0.88 :
                     _state.screenCategory === 'sm' ? 0.92 :
                     _state.screenCategory === 'xxl' ? 1.12 : 1.0;
  const adjustedSize = baseSize * multiplier;
  return Math.max(size * 0.82, Math.min(adjustedSize, size * 1.25));
};

/**
 * 여백/패딩 정규화
 */
export const normalizeSpace = (size: number): number => {
  initializeScreenDimensions();
  if (!_state.initialized) return Math.round(size);
  const baseSize = normalize(size);
  if (_state.screenCategory === 'xs' || _state.screenCategory === 'sm') {
    return Math.max(size * 0.75, baseSize);
  } else if (_state.screenCategory === 'xxl') {
    return Math.min(size * 1.3, baseSize);
  }
  return Math.max(size * 0.7, Math.min(baseSize, size * 1.25));
};

/**
 * 터치 가능한 영역 크기 정규화 (최소 44dp 보장)
 */
export const normalizeTouchable = (size: number): number => {
  initializeScreenDimensions();
  if (!_state.initialized) return Math.max(Math.round(size), 44);
  const minTouchSize = 44;
  const normalized = normalize(size);
  return Math.max(normalized, minTouchSize);
};

/**
 * 카드 모서리 반경 정규화
 */
export const normalizeBorderRadius = (size: number): number => {
  initializeScreenDimensions();
  if (!_state.initialized) return Math.max(8, Math.min(Math.round(size), 20));
  const baseSize = normalize(size);
  return Math.max(8, Math.min(baseSize, 20));
};

/**
 * 그림자 강도 계산
 */
export const normalizeShadow = (elevation: number): number => {
  initializeScreenDimensions();
  if (!_state.initialized) return Math.max(1, Math.min(Math.round(elevation), 10));
  const baseElevation = normalize(elevation);
  return Math.max(1, Math.min(baseElevation, 10));
};

// 화면 크기 정보 객체 (초기화 필요)
let _screenInfoCache: any = null;

// 화면 크기 정보 가져오기 (lazy initialization)
export const getScreenInfo = () => {
  if (!_screenInfoCache) {
    initializeScreenDimensions();
    _screenInfoCache = {
      width: _state.screenWidth,
      height: _state.screenHeight,
      scale: _state.scale,
      scaleMultiplier: _state.scaleMultiplier,
      category: _state.screenCategory,
      fontScale: PixelRatio.getFontScale(),
      pixelRatio: PixelRatio.get(),
      isXSmall: _state.screenCategory === 'xs',
      isSmall: _state.screenCategory === 'sm',
      isMedium: _state.screenCategory === 'md',
      isLarge: _state.screenCategory === 'lg',
      isXLarge: _state.screenCategory === 'xl',
      isXXLarge: _state.screenCategory === 'xxl',
      isPhone: _state.screenWidth < BREAKPOINTS.XXL,
      isTablet: _state.screenWidth >= BREAKPOINTS.XXL,
    };
  }
  return _screenInfoCache;
};

// Backward compatibility - 빈 객체로 시작, 사용시 초기화
export const screenInfo = {
  get width() { return getScreenInfo().width; },
  get height() { return getScreenInfo().height; },
  get scale() { return getScreenInfo().scale; },
  get scaleMultiplier() { return getScreenInfo().scaleMultiplier; },
  get category() { return getScreenInfo().category; },
  get fontScale() { return getScreenInfo().fontScale; },
  get pixelRatio() { return getScreenInfo().pixelRatio; },
  get isXSmall() { return getScreenInfo().isXSmall; },
  get isSmall() { return getScreenInfo().isSmall; },
  get isMedium() { return getScreenInfo().isMedium; },
  get isLarge() { return getScreenInfo().isLarge; },
  get isXLarge() { return getScreenInfo().isXLarge; },
  get isXXLarge() { return getScreenInfo().isXXLarge; },
  get isPhone() { return getScreenInfo().isPhone; },
  get isTablet() { return getScreenInfo().isTablet; },
};

/**
 * ReviewScreen용 간단한 scale 계산 (React Native 0.80 호환)
 * BASE_WIDTH=360 기준으로 0.8~1.5 범위 허용
 */
export const getScale = (baseWidth: number = 360, minScale: number = 0.8, maxScale: number = 1.5): number => {
  initializeScreenDimensions();
  if (!_state.initialized) return 1;
  const calculatedScale = _state.screenWidth / baseWidth;
  return Math.min(Math.max(calculatedScale, minScale), maxScale);
};
