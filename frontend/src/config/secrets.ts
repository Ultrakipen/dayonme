/**
 * ============================================================
 * 보안 관련 환경 변수 설정
 * ============================================================
 *
 * 모든 민감한 키는 환경변수에서 로드합니다.
 * .env 파일에 설정하거나 CI/CD에서 주입하세요.
 *
 * ============================================================
 */

import Config from 'react-native-config';

// 환경변수에서 카카오 설정 로드 (하드코딩 제거)
export const KAKAO_CONFIG = {
  REST_API_KEY: Config.KAKAO_REST_API_KEY || '',
  NATIVE_APP_KEY: Config.KAKAO_NATIVE_APP_KEY || '',
  REDIRECT_URI: Config.KAKAO_REDIRECT_URI || '',
};

// 프로덕션 URL 설정 여부 체크
export const isKakaoConfigured = () => {
  return (
    KAKAO_CONFIG.REST_API_KEY.length > 0 &&
    KAKAO_CONFIG.NATIVE_APP_KEY.length > 0 &&
    !KAKAO_CONFIG.REDIRECT_URI.includes('localhost')
  );
};

// OneSignal 설정
export const ONESIGNAL_CONFIG = {
  APP_ID: Config.ONESIGNAL_APP_ID || '',
};

// 앱 시작시 설정 검증 (프로덕션에서만)
export const validateSecrets = () => {
  const errors: string[] = [];

  if (!KAKAO_CONFIG.REST_API_KEY) {
    errors.push('KAKAO_REST_API_KEY가 설정되지 않았습니다');
  }

  if (!KAKAO_CONFIG.NATIVE_APP_KEY) {
    errors.push('KAKAO_NATIVE_APP_KEY가 설정되지 않았습니다');
  }

  if (!KAKAO_CONFIG.REDIRECT_URI) {
    errors.push('KAKAO_REDIRECT_URI가 설정되지 않았습니다');
  }

  if (!__DEV__ && KAKAO_CONFIG.REDIRECT_URI.includes('localhost')) {
    errors.push('프로덕션에서 REDIRECT_URI가 localhost입니다');
  }

  if (!ONESIGNAL_CONFIG.APP_ID) {
    errors.push('ONESIGNAL_APP_ID가 설정되지 않았습니다');
  }

  if (errors.length > 0 && !__DEV__) {
    console.error('🚨 보안 설정 오류:', errors.join(', '));
  }

  return errors;
};

/**
 * ============================================================
 * 📋 프로덕션 배포 전 체크리스트:
 * ============================================================
 * □ .env.production 파일에 모든 키 설정
 * □ 카카오 개발자 콘솔에서 프로덕션 앱 등록
 * □ REDIRECT_URI를 프로덕션 도메인으로 변경
 * □ OneSignal 프로덕션 앱 ID 설정
 * □ CI/CD에서 환경변수 주입 설정
 * ============================================================
 */
