// constants/spacing.ts
// 표준화된 간격 시스템 (인스타그램 스타일 + 2026 모바일 트렌드)
// React Native 0.80 호환성: lazy initialization
import { scale, verticalScale } from './responsive';

// 초기화 플래그
let _initialized = false;

// 실제 값들을 저장할 객체
const _values: any = {
  SPACING: {},
  VERTICAL_SPACING: {},
  PADDING: {},
  MARGIN: {},
  COMPONENT_SPACING: {},
  BORDER_RADIUS: {},
  SAFE_AREA: {},
};

/**
 * 모든 spacing 값을 초기화하는 함수
 * App이 mount된 후 한 번만 호출됨
 */
export const initializeSpacing = () => {
  if (_initialized) return;

  // SPACING 초기화
  Object.assign(_values.SPACING, {
    xxs: scale(4),
    xs: scale(8),
    sm: scale(12),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
    xxxl: scale(64),
  });

  // VERTICAL_SPACING 초기화
  Object.assign(_values.VERTICAL_SPACING, {
    xxs: verticalScale(4),
    xs: verticalScale(8),
    sm: verticalScale(12),
    md: verticalScale(16),
    lg: verticalScale(24),
    xl: verticalScale(32),
    xxl: verticalScale(48),
    xxxl: verticalScale(64),
  });

  // PADDING 초기화
  Object.assign(_values.PADDING, {
    screenHorizontal: scale(16),
    screenVertical: verticalScale(16),
    card: scale(16),
    cardSmall: scale(12),
    cardLarge: scale(20),
    button: {
      horizontal: scale(24),
      vertical: verticalScale(14),
    },
    buttonSmall: {
      horizontal: scale(16),
      vertical: verticalScale(10),
    },
    buttonLarge: {
      horizontal: scale(32),
      vertical: verticalScale(16),
    },
    input: {
      horizontal: scale(16),
      vertical: verticalScale(14),
    },
  });

  // MARGIN 초기화
  Object.assign(_values.MARGIN, {
    elementSmall: scale(8),
    element: scale(12),
    elementLarge: scale(16),
    section: scale(24),
    sectionLarge: scale(32),
    screen: scale(16),
  });

  // COMPONENT_SPACING 초기화
  Object.assign(_values.COMPONENT_SPACING, {
    listItem: scale(12),
    listItemLarge: scale(16),
    card: scale(12),
    cardGrid: scale(8),
    iconText: scale(8),
    iconTextSmall: scale(6),
    buttonGroup: scale(12),
    formField: verticalScale(16),
    formFieldLarge: verticalScale(20),
  });

  // BORDER_RADIUS 초기화
  Object.assign(_values.BORDER_RADIUS, {
    none: 0,
    xs: scale(4),
    sm: scale(8),
    md: scale(12),
    lg: scale(16),
    xl: scale(20),
    full: 9999,
  });

  // SAFE_AREA 초기화
  Object.assign(_values.SAFE_AREA, {
    top: verticalScale(44),
    bottom: verticalScale(34),
  });

  _initialized = true;
};

// Export할 객체들 (빈 객체로 시작)
export const SPACING = _values.SPACING;
export const VERTICAL_SPACING = _values.VERTICAL_SPACING;
export const PADDING = _values.PADDING;
export const MARGIN = _values.MARGIN;
export const COMPONENT_SPACING = _values.COMPONENT_SPACING;
export const BORDER_RADIUS = _values.BORDER_RADIUS;
export const SAFE_AREA = _values.SAFE_AREA;

/**
 * 보더 두께 (Border Width) - 정적 값이므로 lazy 불필요
 */
export const BORDER_WIDTH = {
  thin: 0.5,
  normal: 1,
  thick: 2,
  thicker: 3,
};

/**
 * 헤더 높이
 */
let _headerHeight: number | null = null;
export const getHeaderHeight = () => {
  if (_headerHeight === null) {
    _headerHeight = verticalScale(56);
  }
  return _headerHeight;
};

export const HEADER_HEIGHT = 56; // 기본값

/**
 * 탭 바 높이
 */
let _tabBarHeight: number | null = null;
export const getTabBarHeight = () => {
  if (_tabBarHeight === null) {
    _tabBarHeight = verticalScale(60);
  }
  return _tabBarHeight;
};

export const TAB_BAR_HEIGHT = 60; // 기본값

/**
 * 간격 생성 헬퍼 함수
 * @param multiplier 기본 간격의 배수
 */
export const spacing = (multiplier: number): number => {
  return scale(8 * multiplier);
};

/**
 * 수직 간격 생성 헬퍼 함수
 * @param multiplier 기본 간격의 배수
 */
export const verticalSpacing = (multiplier: number): number => {
  return verticalScale(8 * multiplier);
};
