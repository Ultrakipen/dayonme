/**
 * 햅틱 피드백 유틸리티 (순수 React Native용)
 *
 * 설치:
 * npm install react-native-haptic-feedback
 * cd ios && pod install
 */

import { Platform } from 'react-native';

// 타입 정의
type HapticType =
  | 'selection'      // 가벼운 탭 (리스트 선택 등)
  | 'impactLight'    // 가벼운 충격 (좋아요 등)
  | 'impactMedium'   // 중간 충격 (버튼 클릭)
  | 'impactHeavy'    // 강한 충격 (중요한 액션)
  | 'notificationSuccess'  // 성공
  | 'notificationWarning'  // 경고
  | 'notificationError';   // 에러

/**
 * 햅틱 피드백 실행
 *
 * @example
 * // 좋아요 버튼
 * triggerHaptic('impactLight');
 *
 * // 챌린지 참여 버튼
 * triggerHaptic('impactMedium');
 *
 * // 성공 알림
 * triggerHaptic('notificationSuccess');
 */
export const triggerHaptic = (type: HapticType = 'impactLight'): void => {
  // 플랫폼별 처리
  if (Platform.OS === 'ios') {
    try {
      // iOS에서만 동적 import (Android는 무시)
      const ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;

      const options = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      };

      ReactNativeHapticFeedback.trigger(type, options);
    } catch (error) {
      // 라이브러리 미설치 시 무시
      console.log('Haptic feedback not available');
    }
  } else if (Platform.OS === 'android') {
    try {
      const ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;

      // Android는 제한적 지원
      const androidType = type.includes('impact') ? 'impactLight' : type;

      ReactNativeHapticFeedback.trigger(androidType, {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  }
};

/**
 * 좋아요/북마크용 가벼운 햅틱
 */
export const hapticSelection = () => triggerHaptic('selection');

/**
 * 버튼 클릭용 중간 햅틱
 */
export const hapticButton = () => triggerHaptic('impactMedium');

/**
 * 중요한 액션용 강한 햅틱
 */
export const hapticImportant = () => triggerHaptic('impactHeavy');

/**
 * 성공 피드백
 */
export const hapticSuccess = () => triggerHaptic('notificationSuccess');

/**
 * 에러 피드백
 */
export const hapticError = () => triggerHaptic('notificationError');

/**
 * 사용 예시 (주석)
 *
 * // 1. 좋아요 버튼
 * <TouchableOpacity onPress={() => {
 *   hapticSelection();
 *   handleLike();
 * }}>
 *
 * // 2. 챌린지 참여 버튼
 * <TouchableOpacity onPress={() => {
 *   hapticButton();
 *   handleJoinChallenge();
 * }}>
 *
 * // 3. 댓글 전송 성공
 * await submitComment();
 * hapticSuccess();
 *
 * // 4. 에러 발생
 * catch (error) {
 *   hapticError();
 *   Alert.alert('오류', error.message);
 * }
 */

export default {
  trigger: triggerHaptic,
  selection: hapticSelection,
  button: hapticButton,
  important: hapticImportant,
  success: hapticSuccess,
  error: hapticError,
};
