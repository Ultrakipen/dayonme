/**
 * 에러 리포팅 서비스
 * 프로덕션 환경에서 에러를 추적하고 분석하기 위한 유틸리티
 */

import { ErrorInfo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sentry 설정 (프로덕션에서 활성화)
// npm install @sentry/react-native 설치 후 주석 해제
// import * as Sentry from '@sentry/react-native';

interface ErrorReport {
  timestamp: string;
  error: string;
  errorInfo?: string;
  componentStack?: string;
  userAgent?: string;
  appVersion?: string;
  userId?: string;
  screenName?: string;
  additionalInfo?: Record<string, unknown>;
}

// 에러 로그 저장 키
const ERROR_LOG_KEY = '@error_logs';
const MAX_ERROR_LOGS = 50; // 최대 저장할 에러 로그 수

/**
 * 에러 리포팅 서비스 초기화
 * 앱 시작 시 호출
 */
export const initErrorReporting = async (): Promise<void> => {
  if (__DEV__) {
    console.log('📊 [ErrorReporting] 개발 모드 - 로컬 에러 로깅만 활성화');
    return;
  }

  // Sentry 초기화 (프로덕션)
  // 주석 해제하여 활성화:
  /*
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'YOUR_SENTRY_DSN_HERE',
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    tracesSampleRate: 0.2, // 성능 모니터링 20% 샘플링
    beforeSend(event) {
      // 민감한 정보 제거
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
  */

  console.log('📊 [ErrorReporting] 프로덕션 모드 - 에러 리포팅 활성화');
};

/**
 * 사용자 컨텍스트 설정
 * 로그인 시 호출
 */
export const setUserContext = (userId: string, nickname?: string): void => {
  if (__DEV__) return;

  // Sentry 사용자 설정
  /*
  Sentry.setUser({
    id: userId,
    username: nickname,
  });
  */
};

/**
 * 사용자 컨텍스트 초기화
 * 로그아웃 시 호출
 */
export const clearUserContext = (): void => {
  if (__DEV__) return;

  // Sentry 사용자 초기화
  // Sentry.setUser(null);
};

/**
 * 에러 리포트 전송
 * ErrorBoundary에서 호출
 */
export const reportError = async (
  error: Error,
  errorInfo?: ErrorInfo,
  additionalInfo?: Record<string, unknown>
): Promise<void> => {
  const errorReport: ErrorReport = {
    timestamp: new Date().toISOString(),
    error: error.message || error.toString(),
    errorInfo: errorInfo?.componentStack,
    componentStack: errorInfo?.componentStack,
    additionalInfo,
  };

  // 개발 환경: 콘솔 출력
  if (__DEV__) {
    console.error('🚨 [ErrorReporting] 에러 발생:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      additionalInfo,
    });
  }

  // 로컬 저장 (오프라인 지원)
  await saveErrorLocally(errorReport);

  // 프로덕션: Sentry 전송
  if (!__DEV__) {
    // Sentry.captureException(error, {
    //   extra: {
    //     componentStack: errorInfo?.componentStack,
    //     ...additionalInfo,
    //   },
    // });
  }
};

/**
 * 경고 메시지 리포트
 * 심각하지 않은 문제 추적
 */
export const reportWarning = (
  message: string,
  additionalInfo?: Record<string, unknown>
): void => {
  if (__DEV__) {
    console.warn('⚠️ [ErrorReporting] 경고:', message, additionalInfo);
    return;
  }

  // Sentry.captureMessage(message, {
  //   level: 'warning',
  //   extra: additionalInfo,
  // });
};

/**
 * 성능 측정 시작
 * 중요한 작업의 성능 추적
 */
export const startPerformanceTrace = (name: string): (() => void) => {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
    if (__DEV__) {
      console.log(`⏱️ [Performance] ${name}: ${duration}ms`);
    }

    // 프로덕션: 성능 데이터 전송
    // Sentry.addBreadcrumb({
    //   category: 'performance',
    //   message: `${name}: ${duration}ms`,
    //   level: 'info',
    // });
  };
};

/**
 * 로컬에 에러 저장 (오프라인 지원)
 */
const saveErrorLocally = async (errorReport: ErrorReport): Promise<void> => {
  try {
    const existingLogs = await AsyncStorage.getItem(ERROR_LOG_KEY);
    const logs: ErrorReport[] = existingLogs ? JSON.parse(existingLogs) : [];

    // 최신 에러 추가
    logs.unshift(errorReport);

    // 최대 개수 제한
    const trimmedLogs = logs.slice(0, MAX_ERROR_LOGS);

    await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmedLogs));
  } catch (e) {
    // 에러 저장 실패는 무시 (무한 루프 방지)
    if (__DEV__) {
      console.error('에러 로그 저장 실패:', e);
    }
  }
};

/**
 * 저장된 에러 로그 조회 (디버깅/관리자용)
 */
export const getStoredErrorLogs = async (): Promise<ErrorReport[]> => {
  try {
    const logs = await AsyncStorage.getItem(ERROR_LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
};

/**
 * 저장된 에러 로그 삭제
 */
export const clearStoredErrorLogs = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ERROR_LOG_KEY);
  } catch (e) {
    if (__DEV__) {
      console.error('에러 로그 삭제 실패:', e);
    }
  }
};

/**
 * 네비게이션 추적 (화면 전환 로깅)
 */
export const trackScreenView = (screenName: string): void => {
  if (__DEV__) {
    console.log(`📱 [Navigation] 화면 전환: ${screenName}`);
    return;
  }

  // Sentry.addBreadcrumb({
  //   category: 'navigation',
  //   message: `Screen: ${screenName}`,
  //   level: 'info',
  // });
};

/**
 * 사용자 액션 추적 (중요한 동작 로깅)
 */
export const trackUserAction = (
  action: string,
  category: string,
  data?: Record<string, unknown>
): void => {
  if (__DEV__) {
    console.log(`👆 [Action] ${category}: ${action}`, data);
    return;
  }

  // Sentry.addBreadcrumb({
  //   category,
  //   message: action,
  //   data,
  //   level: 'info',
  // });
};

export default {
  initErrorReporting,
  setUserContext,
  clearUserContext,
  reportError,
  reportWarning,
  startPerformanceTrace,
  getStoredErrorLogs,
  clearStoredErrorLogs,
  trackScreenView,
  trackUserAction,
};
