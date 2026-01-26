// constants/theme.ts
// 새로운 디자인 시스템 - 심플하고 현대적인 테마

// 라이트 테마 색상 팔레트
export const LIGHT_COLORS = {
    // 기본 배경 & 서피스
    BACKGROUND: '#FFFFFF',
    SURFACE: '#FFFFFF',
    
    // 텍스트 색상 - 높은 대비율로 가독성 향상
    TEXT_PRIMARY: '#262626',
    TEXT_SECONDARY: '#8E8E8E',
    TEXT_TERTIARY: '#C7C7C7',
    
    // 테두리 & 구분선 - 미묘하고 깔끔한 구분
    BORDER: '#DBDBDB',
    BORDER_LIGHT: '#EFEFEF',
    DIVIDER: '#F0F0F0',
    
    // 아이콘 색상
    ICON_DEFAULT: '#262626', // 기본 진한 회색
    ICON_SECONDARY: '#8E8E8E', // 보조 회색
    
    // 컴포넌트 배경
    CARD_BACKGROUND: '#FFFFFF',
    INPUT_BACKGROUND: '#FAFAFA',
};

// 다크 테마 색상 팔레트 (2026 트렌드: OLED 최적화 + 계층 구분 개선)
export const DARK_COLORS = {
    // 기본 배경 & 서피스 - 계층 구분 개선
    BACKGROUND: '#121212',     // 순수 검정 대신 약간의 회색
    SURFACE: '#1E1E1E',        // 배경과 명확한 구분

    // 텍스트 색상 - 눈 피로 감소
    TEXT_PRIMARY: '#F5F5F5',   // 순백색 대신 약간 부드럽게
    TEXT_SECONDARY: '#B0B0B0', // 보조 텍스트 대비 개선
    TEXT_TERTIARY: '#707070',  // 3차 텍스트

    // 테두리 & 구분선 - 더 뚜렷하게
    BORDER: '#3A3A3A',
    BORDER_LIGHT: '#2E2E2E',
    DIVIDER: '#252525',

    // 아이콘 색상
    ICON_DEFAULT: '#F5F5F5',   // 기본 (부드러운 흰색)
    ICON_SECONDARY: '#909090', // 보조 회색

    // 컴포넌트 배경 - 명확한 계층
    CARD_BACKGROUND: '#262626',  // 카드 더 밝게
    INPUT_BACKGROUND: '#2A2A2A', // 입력 필드
};

// 공통 색상 (라이트/다크 테마 공통)
export const COMMON_COLORS = {
    // 액센트 색상 - 우리만의 보라색 팔레트
    PRIMARY: '#8B5CF6', // 메인 보라색
    PRIMARY_LIGHT: '#A78BFA', // 밝은 보라색
    PRIMARY_DARK: '#7C3AED', // 진한 보라색
    
    // 아이콘 선택 색상
    ICON_SELECTED: '#8B5CF6', // 선택된 상태 보라색
    
    // 상태 색상
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6',
    
    // 특수 색상
    TRANSPARENT: 'transparent',
    OVERLAY: 'rgba(0, 0, 0, 0.5)',
    
    // 감정 색상
    EMOTION: {
      HAPPY: '#FFD700', // 행복
      GRATEFUL: '#FF69B4', // 감사
      COMFORTING: '#87CEEB', // 위로
      TOUCHED: '#FF6347', // 감동
      SAD: '#4682B4', // 슬픔
      ANXIOUS: '#DDA0DD', // 불안
      ANGRY: '#FF4500', // 화남
      TIRED: '#A9A9A9', // 지침
      DEPRESSED: '#708090', // 우울
      LONELY: '#8B4513', // 고독
      SHOCKED: '#9932CC', // 충격
      COMFORTABLE: '#32CD32', // 편함
    },
};

// 테마 생성 함수
const createTheme = (colorScheme: 'light' | 'dark') => {
  const themeColors = colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  return {
    ...themeColors,
    ...COMMON_COLORS,
  };
};

// 기본 색상 (하위 호환성을 위해)
export const COLORS = createTheme('light');
  
// 타이포그래피 - 인스타그램 스타일 + 가독성 최적화 + Pretendard 폰트
export const TYPOGRAPHY = {
  // 헤더
  H1: { fontSize: 24, fontFamily: 'Pretendard-Bold', lineHeight: 32, letterSpacing: -0.3 },
  H2: { fontSize: 20, fontFamily: 'Pretendard-SemiBold', lineHeight: 28, letterSpacing: -0.3 },
  H3: { fontSize: 18, fontFamily: 'Pretendard-SemiBold', lineHeight: 24, letterSpacing: -0.1 },

  // 본문
  BODY: { fontSize: 15, fontFamily: 'Pretendard-Regular', lineHeight: 22, letterSpacing: -0.1 },
  BODY_MEDIUM: { fontSize: 15, fontFamily: 'Pretendard-Medium', lineHeight: 22, letterSpacing: -0.1 },

  // 작은 텍스트
  CAPTION: { fontSize: 13, fontFamily: 'Pretendard-Regular', lineHeight: 18, letterSpacing: -0.1 },
  CAPTION_MEDIUM: { fontSize: 13, fontFamily: 'Pretendard-Medium', lineHeight: 18, letterSpacing: -0.1 },

  // 라벨
  LABEL: { fontSize: 14, fontFamily: 'Pretendard-Medium', lineHeight: 20, letterSpacing: -0.1 },
  LABEL_SMALL: { fontSize: 12, fontFamily: 'Pretendard-Medium', lineHeight: 16, letterSpacing: -0.1 },
};

// 간격 시스템 - 8pt 그리드 기반
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
};

// 보더 반지름 - 부드럽고 현대적인 느낌
export const BORDER_RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  FULL: 9999,
};
  
// 그림자 - 미묘하고 현대적인 depth 표현
export const SHADOWS = {
  NONE: {},
  SUBTLE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  CARD: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
};

// 컴포넌트 스타일 시스템
export const COMPONENTS = {
  // 카드 스타일
  CARD: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  
  // 버튼 스타일
  BUTTON: {
    PRIMARY: {
      backgroundColor: COLORS.PRIMARY,
      borderRadius: BORDER_RADIUS.MD,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    SECONDARY: {
      backgroundColor: COLORS.BACKGROUND,
      borderColor: COLORS.BORDER,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.MD,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
  },
  
  // 입력 필드 스타일
  INPUT: {
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderColor: COLORS.BORDER,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.BODY.fontSize,
  },
  
  // 감정 태그 스타일
  EMOTION_TAG: {
    borderRadius: BORDER_RADIUS.XL,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS + 2,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.SM,
    marginBottom: SPACING.SM,
  },
};
  
// 테마 색상을 소문자 키로 변환하는 헬퍼 함수
const createThemeWithLowercaseKeys = (colorScheme: 'light' | 'dark') => {
  const themeColors = createTheme(colorScheme);
  return {
    primary: themeColors.PRIMARY,
    primaryLight: themeColors.PRIMARY_LIGHT,
    primaryDark: themeColors.PRIMARY_DARK,
    background: themeColors.BACKGROUND,
    surface: themeColors.SURFACE,
    textPrimary: themeColors.TEXT_PRIMARY,
    textSecondary: themeColors.TEXT_SECONDARY,
    textTertiary: themeColors.TEXT_TERTIARY,
    border: themeColors.BORDER,
    borderLight: themeColors.BORDER_LIGHT,
    divider: themeColors.DIVIDER,
    iconDefault: themeColors.ICON_DEFAULT,
    iconSecondary: themeColors.ICON_SECONDARY,
    iconSelected: themeColors.ICON_SELECTED,
    cardBackground: themeColors.CARD_BACKGROUND,
    inputBackground: themeColors.INPUT_BACKGROUND,
    success: themeColors.SUCCESS,
    warning: themeColors.WARNING,
    error: themeColors.ERROR,
    info: themeColors.INFO,
    transparent: themeColors.TRANSPARENT,
    overlay: themeColors.OVERLAY,
    emotion: themeColors.EMOTION,
  };
};

// 라이트 테마 객체
export const LIGHT_THEME = {
  colors: createThemeWithLowercaseKeys('light'),
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  components: COMPONENTS,
};

// 다크 테마 객체
export const DARK_THEME = {
  colors: createThemeWithLowercaseKeys('dark'),
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  components: COMPONENTS,
};

// 테마 타입 정의
export type ThemeType = 'light' | 'dark';

// THEMES 맵 객체
export const THEMES = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
};

// 기본 테마
export const DEFAULT_THEME: ThemeType = 'light';

// 메인 테마 객체 - 기본은 라이트 테마
export const THEME = LIGHT_THEME;

// 편의를 위한 개별 export
export { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMPONENTS };

// 테마 함수들 export
export { createTheme, LIGHT_COLORS, DARK_COLORS, COMMON_COLORS };

// 기본 테마로 내보내기
export default THEME;