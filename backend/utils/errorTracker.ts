// utils/errorTracker.ts
// 에러 추적 시스템 - Sentry 등 외부 서비스 연동 준비
// 현재는 로컬 로깅, 향후 Sentry 등으로 확장 가능

import { Request } from 'express';

// 에러 심각도
type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

// 에러 컨텍스트
interface ErrorContext {
  userId?: number;
  endpoint?: string;
  method?: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
  headers?: Record<string, string>;
  extra?: Record<string, any>;
}

// 에러 로그 저장소 (메모리 - 프로덕션에서는 외부 서비스 사용)
interface ErrorLog {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  fingerprint: string;
}

const errorLogs: ErrorLog[] = [];
const MAX_ERROR_LOGS = 1000;
const errorCounts = new Map<string, number>();

// 에러 핑거프린트 생성 (중복 에러 그룹화)
const createFingerprint = (error: Error, context: ErrorContext): string => {
  const parts = [
    error.name,
    error.message.substring(0, 100),
    context.endpoint || 'unknown',
    context.method || 'unknown'
  ];
  return Buffer.from(parts.join('|')).toString('base64').substring(0, 32);
};

// 민감 정보 필터링
const sanitizeHeaders = (headers: Record<string, any>): Record<string, string> => {
  const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'password'];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
};

// Request에서 컨텍스트 추출
const extractContext = (req?: Request): ErrorContext => {
  if (!req) return {};

  return {
    userId: (req as any).user?.user_id,
    endpoint: req.originalUrl || req.url,
    method: req.method,
    params: req.params,
    query: req.query as Record<string, any>,
    headers: sanitizeHeaders(req.headers as Record<string, any>),
  };
};

/**
 * 에러 추적 시스템
 */
export const errorTracker = {
  /**
   * 에러 캡처 및 로깅
   */
  captureError: (
    error: Error,
    options: {
      severity?: ErrorSeverity;
      req?: Request;
      extra?: Record<string, any>;
    } = {}
  ): string => {
    const { severity = 'error', req, extra } = options;
    const context = { ...extractContext(req), extra };
    const fingerprint = createFingerprint(error, context);

    // 중복 에러 카운트
    const currentCount = errorCounts.get(fingerprint) || 0;
    errorCounts.set(fingerprint, currentCount + 1);

    const errorLog: ErrorLog = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity,
      message: error.message,
      stack: error.stack,
      context,
      fingerprint,
    };

    // 로그 저장 (순환 버퍼)
    errorLogs.push(errorLog);
    if (errorLogs.length > MAX_ERROR_LOGS) {
      errorLogs.shift();
    }

    // 콘솔 로깅 (개발 환경)
    const logPrefix = {
      fatal: '🔴 [FATAL]',
      error: '❌ [ERROR]',
      warning: '⚠️ [WARNING]',
      info: 'ℹ️ [INFO]',
    }[severity];

    console.error(`${logPrefix} ${error.message}`, {
      errorId: errorLog.id,
      endpoint: context.endpoint,
      userId: context.userId,
      count: currentCount + 1,
    });

    // TODO: Sentry 연동 시 여기에 추가
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: context });
    // }

    return errorLog.id;
  },

  /**
   * 메시지 캡처 (예외 아닌 이벤트)
   */
  captureMessage: (
    message: string,
    severity: ErrorSeverity = 'info',
    context?: ErrorContext
  ): void => {
    const logPrefix = {
      fatal: '🔴',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    }[severity];

    console.log(`${logPrefix} ${message}`, context || {});
  },

  /**
   * 사용자 컨텍스트 설정
   */
  setUser: (userId: number, extra?: Record<string, any>): void => {
    // TODO: Sentry 연동 시 여기에 추가
    // Sentry.setUser({ id: userId, ...extra });
  },

  /**
   * 최근 에러 로그 조회 (대시보드용)
   */
  getRecentErrors: (limit: number = 50): ErrorLog[] => {
    return errorLogs.slice(-limit).reverse();
  },

  /**
   * 에러 통계 조회
   */
  getErrorStats: (): {
    total: number;
    byFingerprint: Array<{ fingerprint: string; count: number; lastMessage: string }>;
    bySeverity: Record<ErrorSeverity, number>;
    last24h: number;
  } => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const bySeverity: Record<ErrorSeverity, number> = {
      fatal: 0,
      error: 0,
      warning: 0,
      info: 0,
    };

    let last24h = 0;

    for (const log of errorLogs) {
      bySeverity[log.severity]++;
      if (log.timestamp.getTime() > oneDayAgo) {
        last24h++;
      }
    }

    const byFingerprint = Array.from(errorCounts.entries())
      .map(([fingerprint, count]) => {
        const lastError = errorLogs.find(e => e.fingerprint === fingerprint);
        return {
          fingerprint,
          count,
          lastMessage: lastError?.message || 'Unknown',
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      total: errorLogs.length,
      byFingerprint,
      bySeverity,
      last24h,
    };
  },

  /**
   * 에러 로그 초기화
   */
  clearErrors: (): void => {
    errorLogs.length = 0;
    errorCounts.clear();
  },
};

/**
 * Express 에러 핸들러 미들웨어
 */
export const errorTrackerMiddleware = (
  error: Error,
  req: Request,
  res: any,
  next: any
): void => {
  const errorId = errorTracker.captureError(error, {
    severity: 'error',
    req,
  });

  // 이미 응답이 전송된 경우
  if (res.headersSent) {
    return next(error);
  }

  // 클라이언트에 에러 ID 포함하여 응답
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? '서버 오류가 발생했습니다.'
      : error.message,
    errorId,
  });
};

export default errorTracker;
