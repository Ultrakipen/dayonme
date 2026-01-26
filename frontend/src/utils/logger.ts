/**
 * 개발 환경에서만 로그를 출력하는 유틸리티
 * 프로덕션 환경에서는 로그가 출력되지 않아 성능 저하와 민감 정보 노출을 방지
 */

const isDev = __DEV__;

export const logger = {
  /**
   * 일반 로그
   */
  log: (...args: any[]) => {
    if (isDev) {
      if (__DEV__) console.log(...args);
    }
  },

  /**
   * 에러 로그 (프로덕션에서는 민감 정보 제외)
   */
  error: (...args: any[]) => {
    if (isDev) {
      // 개발 환경: 전체 정보 출력
      if (__DEV__) console.error(...args);
    } else {
      // 프로덕션: 민감 정보 필터링
      const safeArgs = args.map(arg => {
        if (arg && typeof arg === 'object') {
          // 민감한 필드 제거
          const { headers, config, request, ...safe } = arg;
          return safe;
        }
        return arg;
      });
      if (__DEV__) console.error(...safeArgs);
    }
  },

  /**
   * 경고 로그
   */
  warn: (...args: any[]) => {
    if (isDev) {
      if (__DEV__) console.warn(...args);
    }
  },

  /**
   * 디버그 로그 (개발 환경에서만)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * 정보 로그
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * 그룹 시작
   */
  group: (label: string) => {
    if (isDev && console.group) {
      console.group(label);
    }
  },

  /**
   * 그룹 종료
   */
  groupEnd: () => {
    if (isDev && console.groupEnd) {
      console.groupEnd();
    }
  },

  /**
   * 테이블 형식 로그
   */
  table: (data: any) => {
    if (isDev && console.table) {
      console.table(data);
    }
  },
};

export default logger;
