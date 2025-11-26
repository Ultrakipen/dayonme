/**
 * CSRF/API 보안 미들웨어
 * 모바일 앱용 API 보안 강화
 * Redis 기반 분산 환경 지원 (10만+ 사용자 대응)
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { cacheHelper } from '../config/redis';

// 토큰 만료 시간 (30분)
const TOKEN_EXPIRY_SECONDS = 30 * 60;

// 메모리 폴백 저장소 (Redis 비활성화 시)
const memoryStore = new Map<string, { token: string; expires: number }>();

// 메모리 폴백 정리 주기 (5분)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// 만료된 토큰 정리 (메모리 폴백)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.expires < now) {
      memoryStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// CSRF 키 생성 헬퍼
const getCsrfKey = (userId: string | number, sessionId: string): string => {
  return `csrf:${userId}:${sessionId}`;
};

/**
 * CSRF 토큰 생성 (Redis 우선, 메모리 폴백)
 */
export const generateCsrfToken = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.user_id || 'anonymous';
  const sessionId = req.headers['x-session-id'] as string || crypto.randomBytes(16).toString('hex');

  const token = crypto.randomBytes(32).toString('hex');
  const key = getCsrfKey(userId, sessionId);

  try {
    // Redis 사용 가능하면 Redis에 저장
    if (cacheHelper.isAvailable()) {
      await cacheHelper.set(key, { token, createdAt: Date.now() }, TOKEN_EXPIRY_SECONDS);
    } else {
      // 메모리 폴백
      memoryStore.set(key, {
        token,
        expires: Date.now() + (TOKEN_EXPIRY_SECONDS * 1000)
      });
    }

    res.json({
      status: 'success',
      data: {
        csrfToken: token,
        sessionId, // 클라이언트가 세션 ID를 저장할 수 있도록
        expiresIn: TOKEN_EXPIRY_SECONDS
      }
    });
  } catch (error) {
    console.error('[CSRF] 토큰 생성 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '토큰 생성 중 오류가 발생했습니다.'
    });
  }
};

/**
 * CSRF 토큰 검증 미들웨어
 * POST, PUT, DELETE, PATCH 요청에서 토큰 검증
 */
export const validateCsrfToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // GET, HEAD, OPTIONS 요청은 검증 제외
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 개발 환경에서는 선택적 적용
  if (process.env.NODE_ENV === 'development' && process.env.CSRF_ENABLED !== 'true') {
    return next();
  }

  // 특정 경로 제외 (로그인, 회원가입 등)
  const excludedPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/social',
    '/api/health',
    '/health'
  ];

  if (excludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  const userId = (req as any).user?.user_id || 'anonymous';
  const sessionId = req.headers['x-session-id'] as string;

  if (!csrfToken) {
    res.status(403).json({
      status: 'error',
      message: 'CSRF 토큰이 필요합니다.',
      code: 'CSRF_TOKEN_MISSING'
    });
    return;
  }

  if (!sessionId) {
    res.status(403).json({
      status: 'error',
      message: '세션 ID가 필요합니다.',
      code: 'SESSION_ID_MISSING'
    });
    return;
  }

  const key = getCsrfKey(userId, sessionId);

  try {
    let storedData: { token: string } | null = null;

    // Redis 우선 조회
    if (cacheHelper.isAvailable()) {
      storedData = await cacheHelper.get<{ token: string }>(key);
    } else {
      // 메모리 폴백
      const memData = memoryStore.get(key);
      if (memData && memData.expires > Date.now()) {
        storedData = { token: memData.token };
      } else if (memData) {
        memoryStore.delete(key);
      }
    }

    if (!storedData) {
      res.status(403).json({
        status: 'error',
        message: 'CSRF 토큰이 유효하지 않거나 만료되었습니다. 새 토큰을 요청해주세요.',
        code: 'CSRF_TOKEN_INVALID'
      });
      return;
    }

    if (storedData.token !== csrfToken) {
      res.status(403).json({
        status: 'error',
        message: 'CSRF 토큰이 일치하지 않습니다.',
        code: 'CSRF_TOKEN_MISMATCH'
      });
      return;
    }

    // 토큰 사용 후 새 토큰 생성 (One-time use)
    const newToken = crypto.randomBytes(32).toString('hex');

    if (cacheHelper.isAvailable()) {
      await cacheHelper.set(key, { token: newToken, createdAt: Date.now() }, TOKEN_EXPIRY_SECONDS);
    } else {
      memoryStore.set(key, {
        token: newToken,
        expires: Date.now() + (TOKEN_EXPIRY_SECONDS * 1000)
      });
    }

    // 새 토큰을 응답 헤더에 포함
    res.setHeader('X-New-CSRF-Token', newToken);

    next();
  } catch (error) {
    console.error('[CSRF] 토큰 검증 오류:', error);
    // 오류 시에도 요청은 계속 처리 (가용성 우선)
    next();
  }
};

/**
 * API 키 검증 미들웨어 (모바일 앱 식별)
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  // 개발 환경에서는 건너뛰기
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!validApiKey) {
    // API 키가 설정되지 않은 경우 건너뛰기
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({
      status: 'error',
      message: '유효하지 않은 API 키입니다.',
      code: 'INVALID_API_KEY'
    });
    return;
  }

  next();
};

/**
 * 요청 출처 검증 미들웨어
 */
export const validateOrigin = (req: Request, res: Response, next: NextFunction): void => {
  // 개발 환경에서는 건너뛰기
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const origin = req.headers.origin;
  const userAgent = req.headers['user-agent'] || '';

  // 모바일 앱 User-Agent 패턴
  const mobileAppPattern = /iexist|dayonme|okhttp|expo|react-native/i;

  // 허용된 origin 목록
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

  // 모바일 앱 요청 허용
  if (mobileAppPattern.test(userAgent)) {
    return next();
  }

  // 웹 요청의 경우 origin 검증
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[CSRF] 허용되지 않은 Origin: ${origin}`);
    if (process.env.STRICT_ORIGIN_CHECK === 'true') {
      res.status(403).json({
        status: 'error',
        message: '허용되지 않은 요청 출처입니다.',
        code: 'INVALID_ORIGIN'
      });
      return;
    }
  }

  next();
};

export default {
  generateCsrfToken,
  validateCsrfToken,
  validateApiKey,
  validateOrigin
};
