import { StyleSheet, Dimensions } from 'react-native';

// React Native 0.80 호환성: lazy initialization
let _width = 375;
let _height = 812;
let _initialized = false;

const initDimensions = () => {
  if (!_initialized) {
    const { width, height } = Dimensions.get('window');
    _width = width;
    _height = height;
    _initialized = true;
  }
};

// 앱 전체에서 사용할 색상 테마
export const colors = {
  primary: '#4A6CFF',            // 주요 브랜드 색상
  primaryLight: '#7C91FF',       // 밝은 브랜드 색상
  primaryDark: '#2940CC',        // 어두운 브랜드 색상
  secondary: '#FF6B6B',          // 보조 색상
  tertiary: '#4ECDC4',           // 세 번째 강조색
  
  // 기본 텍스트 및 배경색
  text: '#333333',               // 기본 텍스트 색상
  textSecondary: '#666666',      // 부차적인 텍스트 색상
  textLight: '#999999',          // 연한 텍스트 색상
  background: '#FFFFFF',         // 기본 배경색
  backgroundLight: '#F8F9FA',    // 밝은 배경색
  
  // 상태 색상
  success: '#28A745',            // 성공 상태
  warning: '#FFC107',            // 경고 상태
  error: '#DC3545',              // 오류 상태
  info: '#17A2B8',               // 정보 상태
  
  // 경계선 및 분할선
  border: '#EEEEEE',             // 기본 경계선 색상
  shadow: 'rgba(0, 0, 0, 0.1)',  // 그림자 색상
  
  // 감정 컬러
  emotions: {
    happy: '#FFD700',            // 행복
    sad: '#4682B4',              // 슬픔
    angry: '#FF4500',            // 화남
    nervous: '#DDA0DD',          // 불안
    tired: '#A9A9A9',            // 지침
    comfortable: '#32CD32',      // 편함
  },
};

// 스페이싱 값 (마진, 패딩 등)
export const spacing = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 40,
};

// 폰트 크기
export const typography = {
  tiny: 10,
  small: 12,
  default: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
  xxlarge: 24,
  title: 28,
  headline: 34,
};

// 그림자 스타일
export const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

// 테두리 스타일
export const borders = {
  thin: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  medium: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
  },
  thick: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
  },
  rounded: {
    borderRadius: 50,
  },
};

// 공통 컴포넌트 스타일
export const componentStyles = {
  card: {
    ...shadows.small,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.medium,
  },
  button: {
    primary: {
      backgroundColor: colors.primary,
      padding: spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondary: {
      backgroundColor: 'transparent',
      padding: spacing.medium,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: {
      backgroundColor: colors.textLight,
      padding: spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.medium,
    fontSize: typography.default,
    color: colors.text,
  },
};

// 반응형 화면 너비에 따른 스타일 적용을 위한 유틸리티
export const responsive = {
  get isSmallScreen() {
    initDimensions();
    return _width < 375;
  },
  get isMediumScreen() {
    initDimensions();
    return _width >= 375 && _width < 768;
  },
  get isLargeScreen() {
    initDimensions();
    return _width >= 768;
  },
  get width() {
    initDimensions();
    return _width;
  },
  get height() {
    initDimensions();
    return _height;
  },
};

// 글로벌 스타일
const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    margin: spacing.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    ...componentStyles.input,
    width: '100%',
  },
  textInputError: {
    ...componentStyles.input,
    borderColor: colors.error,
    width: '100%',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.small,
    marginTop: spacing.tiny,
  },
  titleText: {
    fontSize: typography.title,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.medium,
  },
  subtitleText: {
    fontSize: typography.large,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.small,
  },
  bodyText: {
    fontSize: typography.default,
    color: colors.text,
    lineHeight: typography.default * 1.5,
  },
  captionText: {
    fontSize: typography.small,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: 8,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: typography.medium,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.primary,
    fontSize: typography.medium,
    fontWeight: '600',
  },
  card: {
    ...componentStyles.card,
    marginBottom: spacing.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginVertical: spacing.medium,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.medium,
  },
});

export default globalStyles;