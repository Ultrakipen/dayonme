/**
 * Sentry 에러 추적 설정
 * 프로덕션 환경에서 크래시 및 에러를 추적합니다.
 */

import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';

// Sentry 초기화
export const initSentry = () => {
  const dsn = Config.SENTRY_DSN;

  // DSN이 설정되지 않으면 초기화하지 않음
  if (!dsn) {
    if (!__DEV__) {
      console.warn('Sentry DSN이 설정되지 않았습니다. 에러 추적이 비활성화됩니다.');
    }
    return;
  }

  Sentry.init({
    dsn,
    // 개발 환경에서는 비활성화
    enabled: !__DEV__,
    // 환경 설정
    environment: __DEV__ ? 'development' : 'production',
    // 샘플링 비율 (프로덕션 비용 고려)
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // 프로파일링 샘플링 비율
    profilesSampleRate: __DEV__ ? 1.0 : 0.1,
    // 디버그 모드 (개발 환경에서만)
    debug: __DEV__,
    // 앱 버전
    release: Config.APP_VERSION || '1.0.0',
    // 배포 환경
    dist: Config.BUILD_NUMBER || '1',
    // 민감한 데이터 제거
    beforeSend(event) {
      // 사용자 정보에서 민감한 데이터 제거
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
      }
      return event;
    },
    // 빵 부스러기 필터링 (민감한 URL 제거)
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        // 토큰 관련 URL 제거
        if (breadcrumb.data?.url?.includes('token') ||
            breadcrumb.data?.url?.includes('auth')) {
          return null;
        }
      }
      return breadcrumb;
    },
  });
};

// 사용자 컨텍스트 설정 (로그인 시 호출)
export const setSentryUser = (userId: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    username: username || undefined,
  });
};

// 사용자 컨텍스트 제거 (로그아웃 시 호출)
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

// 수동 에러 캡처
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
};

// 수동 메시지 캡처
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// 성능 트랜잭션 시작
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, () => {});
};

export default Sentry;
