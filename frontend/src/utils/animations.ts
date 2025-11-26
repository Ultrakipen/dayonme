import { Animated, Easing } from 'react-native';

/**
 * 페이드 인 애니메이션 생성 함수
 * @param animatedValue Animated.Value 인스턴스
 * @param duration 애니메이션 지속 시간(ms)
 * @returns Animated.CompositeAnimation 객체
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.ease,
    useNativeDriver: true,
  });
};

/**
 * 페이드 아웃 애니메이션 생성 함수
 * @param animatedValue Animated.Value 인스턴스
 * @param duration 애니메이션 지속 시간(ms)
 * @returns Animated.CompositeAnimation 객체
 */
export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.ease,
    useNativeDriver: true,
  });
};

/**
 * 슬라이드 인 애니메이션 생성 함수
 * @param animatedValue Animated.Value 인스턴스
 * @param fromValue 시작 값
 * @param toValue 종료 값
 * @param duration 애니메이션 지속 시간(ms)
 * @returns Animated.CompositeAnimation 객체
 */
export const slideIn = (
  animatedValue: Animated.Value,
  fromValue: number,
  toValue: number,
  duration: number = 300
): Animated.CompositeAnimation => {
  animatedValue.setValue(fromValue);
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * 스케일 애니메이션 생성 함수
 * @param animatedValue Animated.Value 인스턴스
 * @param toValue 종료 값
 * @param duration 애니메이션 지속 시간(ms)
 * @returns Animated.CompositeAnimation 객체
 */
export const scale = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.elastic(1),
    useNativeDriver: true,
  });
};

/**
 * 애니메이션 시퀀스 생성 함수
 * @param animations 순차적으로 실행할 애니메이션 배열
 * @returns Animated.CompositeAnimation 객체
 */
export const sequence = (
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
  return Animated.sequence(animations);
};

/**
 * 애니메이션 병렬 실행 함수
 * @param animations 병렬로 실행할 애니메이션 배열
 * @returns Animated.CompositeAnimation 객체
 */
export const parallel = (
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
  return Animated.parallel(animations);
};

/**
 * 버튼 눌림 효과 애니메이션
 * @param animatedValue Animated.Value 인스턴스
 * @returns 눌림 및 복원 애니메이션 객체들
 */
export const buttonPressAnimation = (animatedValue: Animated.Value) => {
  const pressIn = Animated.timing(animatedValue, {
    toValue: 0.95,
    duration: 100,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  });

  const pressOut = Animated.timing(animatedValue, {
    toValue: 1,
    duration: 100,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  });

  return { pressIn, pressOut };
};